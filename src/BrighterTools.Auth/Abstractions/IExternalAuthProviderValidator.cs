using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Validates provider-issued credentials and translates them into a normalized external identity.
/// </summary>
public interface IExternalAuthProviderValidator
{
    /// <summary>
    /// Gets the external provider this validator supports.
    /// </summary>
    AuthProviderType Provider { get; }
    /// <summary>
    /// Validates a provider-issued credential and returns a normalized external identity.
    /// </summary>
    Task<ExternalIdentity> ValidateAsync(string credential, CancellationToken cancellationToken = default);
}

