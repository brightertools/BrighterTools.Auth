using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Exceptions;
using BrighterTools.Auth.Models;
using BrighterTools.Auth.Services;
using Xunit;

namespace BrighterTools.Auth.Tests;

public sealed class HashOnlyRefreshTokenStoreTests
{
    private sealed class Clock : IClock
    {
        public DateTimeOffset UtcNow { get; set; } = new(2026, 10, 19, 12, 0, 0, TimeSpan.Zero);
    }

    private sealed class Persistence : IRefreshTokenPersistence
    {
        public Dictionary<string, PersistedRefreshToken> Records { get; } = [];
        private readonly object _gate = new();
        public bool FailReplacement { get; set; }
        public TaskCompletionSource? ReadBarrier { get; set; }
        private int _reads;

        public async Task<PersistedRefreshToken?> ReadAsync(string hash, CancellationToken cancellationToken = default)
        {
            PersistedRefreshToken? result;
            lock (_gate) Records.TryGetValue(hash, out result);
            if (ReadBarrier is not null)
            {
                if (Interlocked.Increment(ref _reads) == 2) ReadBarrier.TrySetResult();
                await ReadBarrier.Task.WaitAsync(cancellationToken);
            }
            return result;
        }

        public Task InsertAsync(PersistedRefreshToken token, CancellationToken cancellationToken = default)
        {
            lock (_gate)
            {
                if (Records.Values.Any(x => x.Session.SessionId == token.Session.SessionId))
                    throw new InvalidOperationException("Duplicate session identifier.");
                Records.Add(token.TokenHash, token);
            }
            return Task.CompletedTask;
        }

        public Task<bool> TryReplaceAsync(string hash, DateTimeOffset now, PersistedRefreshToken replacement,
            CancellationToken cancellationToken = default)
        {
            lock (_gate)
            {
                if (!Records.TryGetValue(hash, out var current) || current.RevokedAtUtc.HasValue ||
                    current.ExpiresAtUtc <= now || current.UserId != replacement.UserId ||
                    current.Provider != replacement.Provider || current.Session.AuthenticatedAtUtc != replacement.Session.AuthenticatedAtUtc ||
                    Records.Values.Any(x => x.Session.SessionId == replacement.Session.SessionId))
                    return Task.FromResult(false);
                if (FailReplacement) throw new InvalidOperationException("Synthetic persistence failure.");
                Records.Add(replacement.TokenHash, replacement);
                Records[hash] = current with { RevokedAtUtc = now };
                return Task.FromResult(true);
            }
        }

        public Task RevokeAsync(string hash, DateTimeOffset now, string? reason, CancellationToken cancellationToken = default)
        {
            lock (_gate)
                if (Records.TryGetValue(hash, out var current) && current.RevokedAtUtc is null)
                    Records[hash] = current with { RevokedAtUtc = now };
            return Task.CompletedTask;
        }
    }

    private static RefreshTokenIssueRequest Request(Clock clock, AuthSessionMetadata? session = null,
        string user = "Exact-User-GUID", AuthProviderType provider = AuthProviderType.Password) => new()
    {
        UserId = user, TenantId = "Exact-Tenant-GUID", Provider = provider, IssuedAtUtc = clock.UtcNow,
        ExpiresAtUtc = clock.UtcNow.AddDays(14), Session = session ?? new(Guid.NewGuid(), clock.UtcNow)
    };

    [Fact]
    public async Task RotationPreservesLoginFamilyAndRejectsFamilySubstitution()
    {
        var clock = new Clock(); var persistence = new Persistence();
        var store = new HashOnlyRefreshTokenStore(persistence, clock);
        var family = Guid.NewGuid();
        var original = await store.IssueAsync(Request(clock, new(Guid.NewGuid(), clock.UtcNow, family)));
        await Assert.ThrowsAsync<AuthFailureException>(() => store.RotateAsync(original,
            Request(clock, new(Guid.NewGuid(), clock.UtcNow, Guid.NewGuid()))));
        var replacement = await store.RotateAsync(original, Request(clock, new(Guid.NewGuid(), clock.UtcNow, family)));
        Assert.Equal(family, replacement.Session!.LoginFamilyId);
        Assert.NotEqual(original.Session!.SessionId, replacement.Session.SessionId);
        Assert.Null(await store.FindAsync(original.Token));
    }
    [Fact]
    public async Task IssuePersistsDigestAndExactIdentityNotBearerOrSessionResponse()
    {
        var clock = new Clock(); var persistence = new Persistence();
        var store = new HashOnlyRefreshTokenStore(persistence, clock);
        var request = Request(clock);
        var token = await store.IssueAsync(request);
        var record = Assert.Single(persistence.Records.Values);
        Assert.Equal(Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token.Token))), record.TokenHash);
        Assert.DoesNotContain(token.Token, JsonSerializer.Serialize(record));
        Assert.Equal(request.UserId, record.UserId);
        Assert.Equal(request.TenantId, record.TenantId);
        Assert.Equal(request.Session, record.Session);
        Assert.Equal(request.Session, (await store.FindAsync(token.Token))!.Session);
        Assert.Equal(48, Convert.FromBase64String(token.Token).Length);
    }

    [Fact]
    public async Task RotationPreservesOriginalAuthenticationAndRejectsReplay()
    {
        var clock = new Clock(); var persistence = new Persistence();
        var store = new HashOnlyRefreshTokenStore(persistence, clock);
        var first = await store.IssueAsync(Request(clock));
        clock.UtcNow = clock.UtcNow.AddHours(2);
        var metadata = new AuthSessionMetadata(Guid.NewGuid(), first.Session!.AuthenticatedAtUtc);
        var next = await store.RotateAsync(first, Request(clock, metadata));
        Assert.NotEqual(first.Token, next.Token);
        Assert.Equal(metadata, next.Session);
        Assert.Null(await store.FindAsync(first.Token));
        var error = await Assert.ThrowsAsync<AuthFailureException>(() => store.RotateAsync(first,
            Request(clock, new(Guid.NewGuid(), metadata.AuthenticatedAtUtc))));
        Assert.Equal("invalid_refresh_token", error.Code);
        Assert.Equal(2, persistence.Records.Count);
    }

    [Fact]
    public async Task ConcurrentRotationHasExactlyOneWinnerAfterBothReadActiveState()
    {
        var clock = new Clock(); var persistence = new Persistence();
        var store = new HashOnlyRefreshTokenStore(persistence, clock);
        var original = await store.IssueAsync(Request(clock));
        persistence.ReadBarrier = new(TaskCreationOptions.RunContinuationsAsynchronously);
        async Task<bool> Rotate()
        {
            try
            {
                await store.RotateAsync(original, Request(clock, new(Guid.NewGuid(), original.Session!.AuthenticatedAtUtc)));
                return true;
            }
            catch (AuthFailureException error) { Assert.Equal("invalid_refresh_token", error.Code); return false; }
        }
        var results = await Task.WhenAll(Rotate(), Rotate()).WaitAsync(TimeSpan.FromSeconds(5));
        Assert.Single(results, x => x);
        Assert.Equal(2, persistence.Records.Count);
        Assert.Single(persistence.Records.Values, x => x.RevokedAtUtc is null);
    }

    [Fact]
    public async Task PersistenceFailureDoesNotConsumeTheCurrentToken()
    {
        var clock = new Clock(); var persistence = new Persistence();
        var store = new HashOnlyRefreshTokenStore(persistence, clock);
        var original = await store.IssueAsync(Request(clock));
        persistence.FailReplacement = true;
        await Assert.ThrowsAsync<InvalidOperationException>(() => store.RotateAsync(original, Request(clock)));
        Assert.Single(persistence.Records);
        Assert.NotNull(await store.FindAsync(original.Token));
    }

    [Theory]
    [InlineData("other-user", AuthProviderType.Password)]
    [InlineData("Exact-User-GUID", AuthProviderType.Google)]
    public async Task RotationCannotChangeIdentityOrProvider(string user, AuthProviderType provider)
    {
        var clock = new Clock(); var persistence = new Persistence();
        var store = new HashOnlyRefreshTokenStore(persistence, clock);
        var original = await store.IssueAsync(Request(clock));
        await Assert.ThrowsAsync<AuthFailureException>(() => store.RotateAsync(original, Request(clock, user: user, provider: provider)));
        Assert.Single(persistence.Records);
        Assert.NotNull(await store.FindAsync(original.Token));
    }

    [Fact]
    public async Task RotationCannotResetAuthenticationTimeOrReuseCorrelationId()
    {
        var clock = new Clock(); var persistence = new Persistence();
        var store = new HashOnlyRefreshTokenStore(persistence, clock);
        var original = await store.IssueAsync(Request(clock));
        clock.UtcNow = clock.UtcNow.AddMinutes(1);
        await Assert.ThrowsAsync<AuthFailureException>(() => store.RotateAsync(original, Request(clock)));
        await Assert.ThrowsAsync<AuthFailureException>(() => store.RotateAsync(original, Request(clock, original.Session)));
        Assert.NotNull(await store.FindAsync(original.Token));
    }

    [Fact]
    public async Task ExpiryAndLogoutFailClosedAndUnknownLogoutIsHarmless()
    {
        var clock = new Clock(); var persistence = new Persistence();
        var store = new HashOnlyRefreshTokenStore(persistence, clock);
        var original = await store.IssueAsync(Request(clock));
        await store.RevokeAsync(original.Token, "logout");
        await store.RevokeAsync(original.Token, "logout");
        await store.RevokeAsync("unknown", "logout");
        await store.RevokeAsync("", "logout");
        Assert.Null(await store.FindAsync(original.Token));
        var next = await store.IssueAsync(Request(clock));
        clock.UtcNow = next.ExpiresAtUtc;
        Assert.Null(await store.FindAsync(next.Token));
        await Assert.ThrowsAsync<AuthFailureException>(() => store.RotateAsync(next, Request(clock,
            new(Guid.NewGuid(), next.Session!.AuthenticatedAtUtc))));
    }

    [Fact]
    public async Task MissingCorrelationOrInvalidLifetimeNeverWrites()
    {
        var clock = new Clock(); var persistence = new Persistence();
        var store = new HashOnlyRefreshTokenStore(persistence, clock);
        await Assert.ThrowsAsync<ArgumentException>(() => store.IssueAsync(new RefreshTokenIssueRequest {
            UserId = "user", IssuedAtUtc = clock.UtcNow, ExpiresAtUtc = clock.UtcNow.AddDays(1) }));
        await Assert.ThrowsAsync<ArgumentException>(() => store.IssueAsync(Request(clock, new(Guid.Empty, clock.UtcNow))));
        await Assert.ThrowsAsync<ArgumentException>(() => store.IssueAsync(Request(clock, new(Guid.NewGuid(), clock.UtcNow.AddMinutes(1)))));
        Assert.Empty(persistence.Records);
    }
}
