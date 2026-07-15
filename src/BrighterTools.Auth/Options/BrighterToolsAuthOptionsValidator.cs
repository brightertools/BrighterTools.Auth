using BrighterTools.Auth.Models;
using Microsoft.Extensions.Options;

namespace BrighterTools.Auth.Options;

/// <summary>
/// Validates configured BrighterTools.Auth options.
/// </summary>
public sealed class BrighterToolsAuthOptionsValidator : IValidateOptions<BrighterToolsAuthOptions>
{
    /// <summary>
    /// Validates the configured BrighterTools.Auth options.
    /// </summary>
    public ValidateOptionsResult Validate(string? name, BrighterToolsAuthOptions options)
    {
        var failures = new List<string>();

        if (options.Jwt.AccessTokenLifetime <= TimeSpan.Zero)
        {
            failures.Add("BrighterToolsAuth:Jwt:AccessTokenLifetime must be greater than zero.");
        }

        if (options.RefreshTokens.Lifetime <= TimeSpan.Zero)
        {
            failures.Add("BrighterToolsAuth:RefreshTokens:Lifetime must be greater than zero.");
        }

        if (options.Mfa.RecoveryCodeCount <= 0)
        {
            failures.Add("BrighterToolsAuth:Mfa:RecoveryCodeCount must be greater than zero.");
        }

        if (options.Providers.EnabledProviders is null)
        {
            failures.Add("BrighterToolsAuth:Providers:EnabledProviders must be configured.");
        }

        if (options.SignupAgeGate.Enabled && options.SignupAgeGate.MinimumAge <= 0)
        {
            failures.Add("BrighterToolsAuth:SignupAgeGate:MinimumAge must be greater than zero when signup age-gate validation is enabled.");
        }

        ValidateOidcProvider(failures, options, AuthProviderType.Apple, "Apple", options.ExternalProviders.Apple, requireStaticIssuer: true);
        ValidateOidcProvider(failures, options, AuthProviderType.Google, "Google", options.ExternalProviders.Google, requireStaticIssuer: true);
        ValidateOidcProvider(failures, options, AuthProviderType.Microsoft, "Microsoft", options.ExternalProviders.Microsoft, requireStaticIssuer: false);

        return failures.Count == 0
            ? ValidateOptionsResult.Success
            : ValidateOptionsResult.Fail(failures);
    }

    private static void ValidateOidcProvider(
        ICollection<string> failures,
        BrighterToolsAuthOptions options,
        AuthProviderType provider,
        string providerName,
        OidcExternalProviderOptions providerOptions,
        bool requireStaticIssuer)
    {
        if (options.Providers.EnabledProviders?.Contains(provider) != true)
        {
            return;
        }

        if (providerOptions.ValidationAudiences.Count == 0)
        {
            failures.Add($"BrighterToolsAuth:ExternalProviders:{providerName} must include at least one audience or WebClientId when {providerName} is enabled.");
        }

        if (string.IsNullOrWhiteSpace(providerOptions.MetadataAddress))
        {
            failures.Add($"BrighterToolsAuth:ExternalProviders:{providerName}:MetadataAddress must be configured when {providerName} is enabled.");
        }

        if (requireStaticIssuer && string.IsNullOrWhiteSpace(providerOptions.Issuer))
        {
            failures.Add($"BrighterToolsAuth:ExternalProviders:{providerName}:Issuer must be configured when {providerName} is enabled.");
        }
    }
}