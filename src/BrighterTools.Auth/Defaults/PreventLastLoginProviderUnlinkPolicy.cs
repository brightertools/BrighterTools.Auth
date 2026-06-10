using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Defaults;

/// <summary>
/// Prevents users from removing their final available login method.
/// </summary>
public sealed class PreventLastLoginProviderUnlinkPolicy : IUserLoginProviderUnlinkPolicy
{
    /// <summary>
    /// Evaluates whether the provider may be unlinked.
    /// </summary>
    public Task<ProviderPolicyResult> EvaluateAsync(ProviderUnlinkContext context, CancellationToken cancellationToken = default)
    {
        var enabledProviders = context.User.EnabledProviders.ToHashSet();
        var activeExternalProviders = context.LinkedLogins.Select(login => login.Provider).ToHashSet();

        if (!enabledProviders.Contains(AuthProviderType.Password))
        {
            enabledProviders.Remove(AuthProviderType.Password);
        }

        foreach (var provider in activeExternalProviders)
        {
            enabledProviders.Add(provider);
        }

        enabledProviders.Remove(context.Provider);

        return enabledProviders.Count > 0
            ? Task.FromResult(ProviderPolicyResult.Permit())
            : Task.FromResult(ProviderPolicyResult.Deny("Add another login method before removing this provider."));
    }
}
