using System.Security.Cryptography;
using System.Text;
using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Exceptions;
using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Services;

/// <summary>Shared refresh-token creation, digesting, rotation and revocation protocol.</summary>
/// <remarks>Register explicitly with an atomic host persistence implementation. Raw
/// tokens exist only in the request/response path, never in persistence commands.
/// The host must authorize the current membership and requested tenant before rotation.</remarks>
public sealed class HashOnlyRefreshTokenStore(IRefreshTokenPersistence persistence, IClock clock) : IRefreshTokenStore
{
    /// <inheritdoc />
    public async Task<AuthRefreshToken?> FindAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken)) return null;
        var stored = await persistence.ReadAsync(Digest(refreshToken), cancellationToken);
        return IsActive(stored, clock.UtcNow) ? ToToken(stored!, refreshToken) : null;
    }

    /// <inheritdoc />
    public async Task<AuthRefreshToken> IssueAsync(RefreshTokenIssueRequest request, CancellationToken cancellationToken = default)
    {
        Validate(request, clock.UtcNow);
        var raw = Generate();
        var stored = ToRecord(request, raw);
        await persistence.InsertAsync(stored, cancellationToken);
        return ToToken(stored, raw);
    }

    /// <inheritdoc />
    public async Task<AuthRefreshToken> RotateAsync(AuthRefreshToken currentToken, RefreshTokenIssueRequest request,
        CancellationToken cancellationToken = default)
    {
        Validate(request, clock.UtcNow);
        if (string.IsNullOrWhiteSpace(currentToken.Token)) throw InvalidToken();
        var hash = Digest(currentToken.Token);
        var stored = await persistence.ReadAsync(hash, cancellationToken);
        if (!IsActive(stored, clock.UtcNow) ||
            !string.Equals(stored!.UserId, request.UserId, StringComparison.Ordinal) ||
            stored.Provider != request.Provider ||
            stored.Session.AuthenticatedAtUtc != request.Session!.AuthenticatedAtUtc ||
            stored.Session.SessionId == request.Session.SessionId ||
            stored.Session.LoginFamilyId != request.Session.LoginFamilyId)
            throw InvalidToken();

        var raw = Generate();
        var replacement = ToRecord(request, raw);
        // The repository rechecks all invariants atomically; the read above is not a concurrency lock.
        if (!await persistence.TryReplaceAsync(hash, clock.UtcNow, replacement, cancellationToken))
            throw InvalidToken();
        return ToToken(replacement, raw);
    }

    /// <inheritdoc />
    public Task RevokeAsync(string refreshToken, string? reason, CancellationToken cancellationToken = default) =>
        string.IsNullOrWhiteSpace(refreshToken) ? Task.CompletedTask :
            persistence.RevokeAsync(Digest(refreshToken), clock.UtcNow, reason, cancellationToken);

    private static string Generate() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
    private static string Digest(string raw) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(raw)));
    private static bool IsActive(PersistedRefreshToken? token, DateTimeOffset now) =>
        token is { RevokedAtUtc: null } && token.ExpiresAtUtc > now &&
        token.Session.SessionId != Guid.Empty && token.Session.AuthenticatedAtUtc != default &&
        token.IssuedAtUtc <= now && token.Session.AuthenticatedAtUtc <= token.IssuedAtUtc;

    private static void Validate(RefreshTokenIssueRequest request, DateTimeOffset now)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (string.IsNullOrWhiteSpace(request.UserId) || request.Session is null ||
            request.Session.SessionId == Guid.Empty || request.Session.LoginFamilyId == Guid.Empty || request.Session.AuthenticatedAtUtc == default ||
            request.Session.AuthenticatedAtUtc > request.IssuedAtUtc || request.IssuedAtUtc > now ||
            request.ExpiresAtUtc <= now || request.ExpiresAtUtc <= request.IssuedAtUtc)
            throw new ArgumentException("A valid session correlation and token lifetime are required.", nameof(request));
    }

    private static PersistedRefreshToken ToRecord(RefreshTokenIssueRequest request, string raw) =>
        new(Digest(raw), request.UserId, request.TenantId, request.Provider,
            request.IssuedAtUtc, request.ExpiresAtUtc, request.Session!);

    private static AuthRefreshToken ToToken(PersistedRefreshToken stored, string raw) => new()
    {
        Token = raw, UserId = stored.UserId, TenantId = stored.TenantId, Provider = stored.Provider,
        CreatedAtUtc = stored.IssuedAtUtc, ExpiresAtUtc = stored.ExpiresAtUtc,
        IsRevoked = stored.RevokedAtUtc.HasValue, Session = stored.Session
    };

    private static AuthFailureException InvalidToken() => new("invalid_refresh_token", "The session is invalid or expired.");
}
