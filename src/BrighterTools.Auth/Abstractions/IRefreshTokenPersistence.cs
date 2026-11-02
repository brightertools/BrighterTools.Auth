using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Abstractions;

/// <summary>Database operations for the shared hash-only refresh-token protocol.</summary>
/// <remarks>Implement in the host's custom repositories using its scoped unit of work.
/// These privileged operations are not general identity mutation APIs.</remarks>
public interface IRefreshTokenPersistence
{
    /// <summary>Reads by digest without returning stored bearer credentials.</summary>
    Task<PersistedRefreshToken?> ReadAsync(string tokenHash, CancellationToken cancellationToken = default);

    /// <summary>Inserts a record. Session identifiers and token digests must be unique.</summary>
    Task InsertAsync(PersistedRefreshToken token, CancellationToken cancellationToken = default);

    /// <summary>Atomically consumes an active unexpired record and inserts its replacement.</summary>
    /// <remarks>Under one transaction/conditional write, re-read and check the current record:
    /// matching digest, not revoked, expiry strictly after now, same user/provider/original
    /// authentication time and login-family identifier as replacement, and a different session identifier. Persist
    /// revocation and replacement together or neither. Concurrent consumers must have
    /// exactly one winner. Return false on replay/expiry/conflict; do not independently
    /// commit an outer host transaction. Tenant-switch authorization remains host-owned.</remarks>
    Task<bool> TryReplaceAsync(string currentTokenHash, DateTimeOffset now, PersistedRefreshToken replacement,
        CancellationToken cancellationToken = default);

    /// <summary>Revokes by digest. Hosts using login families may revoke the entire family, including when this row was rotated; unknown values are harmless no-ops.</summary>
    Task RevokeAsync(string tokenHash, DateTimeOffset now, string? reason, CancellationToken cancellationToken = default);
}
