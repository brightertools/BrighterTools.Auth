using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Defaults;

/// <summary>
/// Provides a login provider policy that permits only providers enabled for the current user.
/// </summary>
public sealed class EnabledProvidersUserLoginProviderPolicy : IUserLoginProviderPolicy
{
    /// <summary>
    /// Performs the evaluate operation.
    /// </summary>
    public Task<ProviderPolicyResult> EvaluateAsync(AuthUser user, AuthProviderType provider, string? tenantId, CancellationToken cancellationToken = default)
    {
        if (user.EnabledProviders.Contains(provider))
        {
            return Task.FromResult(ProviderPolicyResult.Permit());
        }

        return Task.FromResult(ProviderPolicyResult.Deny("The requested login method is not enabled for this account."));
    }
}

