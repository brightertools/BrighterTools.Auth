using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Determines whether a validated external identity may provision a new user when no linked account exists.
/// </summary>
public interface IExternalUserProvisioningPolicy
{
    /// <summary>
    /// Determines whether the supplied external identity may provision a new user.
    /// </summary>
    Task<ExternalUserProvisioningDecision> EvaluateAsync(ExternalIdentity identity, CancellationToken cancellationToken = default);
}

