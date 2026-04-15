using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Persists MFA enrollment secrets using the host application's chosen storage model.
/// </summary>
public interface IMfaSecretStore
{
    /// <summary>
    /// Loads the MFA enrollment stored for the specified user.
    /// </summary>
    Task<MfaEnrollment?> GetAsync(string userId, CancellationToken cancellationToken = default);
    /// <summary>
    /// Persists MFA enrollment details for a user.
    /// </summary>
    Task SaveAsync(MfaEnrollment enrollment, CancellationToken cancellationToken = default);
    /// <summary>
    /// Marks MFA as disabled for the specified user.
    /// </summary>
    Task DisableAsync(string userId, CancellationToken cancellationToken = default);
}

