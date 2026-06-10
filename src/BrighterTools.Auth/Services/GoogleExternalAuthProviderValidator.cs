using BrighterTools.Auth.Models;
using BrighterTools.Auth.Options;
using Microsoft.Extensions.Options;

namespace BrighterTools.Auth.Services;

/// <summary>
/// Validates Google identity tokens.
/// </summary>
public sealed class GoogleExternalAuthProviderValidator : OidcExternalAuthProviderValidator
{
    /// <summary>
    /// Initializes a new instance of the GoogleExternalAuthProviderValidator class.
    /// </summary>
    /// <param name="options">The configured BrighterTools auth options.</param>
    public GoogleExternalAuthProviderValidator(IOptions<BrighterToolsAuthOptions> options)
        : base(options.Value.ExternalProviders.Google)
    {
    }

    /// <inheritdoc />
    public override AuthProviderType Provider => AuthProviderType.Google;
}