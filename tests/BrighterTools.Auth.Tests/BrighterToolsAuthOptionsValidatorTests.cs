using BrighterTools.Auth.Models;
using BrighterTools.Auth.Options;
using Xunit;

namespace BrighterTools.Auth.Tests;

public sealed class BrighterToolsAuthOptionsValidatorTests
{
    [Fact]
    public void Validate_WhenMicrosoftUsesDynamicIssuerWithoutStaticIssuer_Succeeds()
    {
        var validator = new BrighterToolsAuthOptionsValidator();
        var options = new BrighterToolsAuthOptions
        {
            Providers = new ProviderOptions
            {
                EnabledProviders = new HashSet<AuthProviderType> { AuthProviderType.Microsoft }
            },
            ExternalProviders = new ExternalProviderOptions
            {
                Microsoft = new OidcExternalProviderOptions
                {
                    Authority = "https://login.microsoftonline.com/common",
                    MetadataAddress = "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
                    WebClientId = "client-id"
                }
            }
        };

        var result = validator.Validate(null, options);

        Assert.True(result.Succeeded);
    }

    [Fact]
    public void Validate_WhenMicrosoftMetadataAddressIsMissing_Fails()
    {
        var validator = new BrighterToolsAuthOptionsValidator();
        var options = new BrighterToolsAuthOptions
        {
            Providers = new ProviderOptions
            {
                EnabledProviders = new HashSet<AuthProviderType> { AuthProviderType.Microsoft }
            },
            ExternalProviders = new ExternalProviderOptions
            {
                Microsoft = new OidcExternalProviderOptions
                {
                    WebClientId = "client-id",
                    MetadataAddress = string.Empty
                }
            }
        };

        var result = validator.Validate(null, options);

        Assert.False(result.Succeeded);
        Assert.Contains(result.Failures, failure => failure.Contains("MetadataAddress", StringComparison.Ordinal));
    }
}