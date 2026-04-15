using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Persists and queries links between host users and external identity providers.
/// </summary>
public interface IExternalLoginStore
{
    /// <summary>
    /// Returns the external logins currently linked to the specified user.
    /// </summary>
    Task<IReadOnlyList<ExternalLogin>> GetLinkedLoginsAsync(string userId, CancellationToken cancellationToken = default);
    /// <summary>
    /// Stores a link between a user and a validated external identity.
    /// </summary>
    Task LinkAsync(string userId, ExternalIdentity identity, CancellationToken cancellationToken = default);
    /// <summary>
    /// Removes a stored external login link.
    /// </summary>
    Task UnlinkAsync(string userId, AuthProviderType provider, string providerSubject, CancellationToken cancellationToken = default);
}

