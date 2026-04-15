using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Creates users and updates password material using the host application's persistence model.
/// </summary>
public interface IUserProvisioningService
{
    /// <summary>
    /// Creates a new user from a validated external identity.
    /// </summary>
    Task<AuthUser> CreateExternalUserAsync(ExternalIdentity identity, CancellationToken cancellationToken = default);
    /// <summary>
    /// Creates a new password-based user record.
    /// </summary>
    Task<AuthUser> CreatePasswordUserAsync(AuthUser user, string password, CancellationToken cancellationToken = default);
    /// <summary>
    /// Updates the stored password hash for the supplied user.
    /// </summary>
    Task UpdatePasswordHashAsync(AuthUser user, string newPasswordHash, CancellationToken cancellationToken = default);
}

