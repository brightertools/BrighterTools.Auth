namespace BrighterTools.Auth.Models;

/// <summary>Host-persisted refresh state. Contains a digest, never the bearer credential.</summary>
public sealed record PersistedRefreshToken(
    string TokenHash,
    string UserId,
    string? TenantId,
    AuthProviderType Provider,
    DateTimeOffset IssuedAtUtc,
    DateTimeOffset ExpiresAtUtc,
    AuthSessionMetadata Session,
    DateTimeOffset? RevokedAtUtc = null);
