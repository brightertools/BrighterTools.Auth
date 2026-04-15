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

        return failures.Count == 0
            ? ValidateOptionsResult.Success
            : ValidateOptionsResult.Fail(failures);
    }
}

