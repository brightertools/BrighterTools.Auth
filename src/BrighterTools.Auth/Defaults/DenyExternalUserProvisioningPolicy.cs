using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Defaults;

/// <summary>
/// Provides an external user provisioning policy that denies automatic user creation by default.
/// </summary>
public sealed class DenyExternalUserProvisioningPolicy : IExternalUserProvisioningPolicy
{
    /// <summary>
    /// Performs the evaluate operation.
    /// </summary>
    public Task<ExternalUserProvisioningDecision> EvaluateAsync(ExternalIdentity identity, CancellationToken cancellationToken = default)
        => Task.FromResult(ExternalUserProvisioningDecision.Deny("No account is linked to this login method."));
}

