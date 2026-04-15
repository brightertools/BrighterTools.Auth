using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Loads host-owned user records needed by authentication workflows.
/// </summary>
public interface IUserLookupService
{
    /// <summary>
    /// Finds a user by the login identifier used for password-based sign-in.
    /// </summary>
    Task<AuthUser?> FindByLoginAsync(string login, CancellationToken cancellationToken = default);
    /// <summary>
    /// Finds a user by its application-owned identifier.
    /// </summary>
    Task<AuthUser?> FindByIdAsync(string userId, CancellationToken cancellationToken = default);
    /// <summary>
    /// Finds a user linked to the specified external provider subject.
    /// </summary>
    Task<AuthUser?> FindByExternalLoginAsync(AuthProviderType provider, string providerSubject, CancellationToken cancellationToken = default);
}

