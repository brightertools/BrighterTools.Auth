using BrighterTools.Auth.Models;
using BrighterTools.Auth.Options;
using Microsoft.Extensions.Options;

namespace BrighterTools.Auth.Services;

/// <summary>
/// Validates Sign in with Apple identity tokens.
/// </summary>
public sealed class AppleExternalAuthProviderValidator : OidcExternalAuthProviderValidator
{
    /// <summary>
    /// Initializes a new instance of the AppleExternalAuthProviderValidator class.
    /// </summary>
    /// <param name="options">The configured BrighterTools auth options.</param>
    public AppleExternalAuthProviderValidator(IOptions<BrighterToolsAuthOptions> options)
        : base(options.Value.ExternalProviders.Apple)
    {
    }

    /// <inheritdoc />
    public override AuthProviderType Provider => AuthProviderType.Apple;
}