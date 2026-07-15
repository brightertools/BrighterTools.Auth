using BrighterTools.Auth.Constants;
using BrighterTools.Auth.Exceptions;
using BrighterTools.Auth.Models;
using BrighterTools.Auth.Options;
using BrighterTools.Auth.Services;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Xunit;

namespace BrighterTools.Auth.Tests;

public sealed class MicrosoftExternalAuthProviderValidatorTests
{
    private const string ConsumerTenantId = "9188040d-6c67-4c5b-b112-36a304b66dad";

    [Fact]
    public async Task ValidateAsync_AllowsDynamicIssuerWithoutStaticIssuer()
    {
        var tenantId = "ecc796ef-f71b-44df-84d5-75c420690964";
        var audience = "fd7070f2-af8e-4b10-93d4-5656a0f05503";
        var signingKey = CreateSigningKey();
        var validator = CreateValidator(audience, signingKey);
        var token = CreateToken(signingKey, audience, tenantId, $"https://login.microsoftonline.com/{tenantId}/v2.0", email: "alice@example.com");

        var identity = await validator.ValidateAsync(token);

        Assert.Equal(AuthProviderType.Microsoft, identity.Provider);
        Assert.Equal("microsoft-subject", identity.ProviderSubject);
        Assert.Equal("alice@example.com", identity.Email);
        Assert.True(identity.EmailVerified);
    }

    [Fact]
    public async Task ValidateAsync_AllowsConsumerIssuerFromLoginLive()
    {
        var audience = "fd7070f2-af8e-4b10-93d4-5656a0f05503";
        var signingKey = CreateSigningKey();
        var validator = CreateValidator(audience, signingKey);
        var token = CreateToken(
            signingKey,
            audience,
            ConsumerTenantId,
            $"https://login.live.com/{ConsumerTenantId}/v2.0",
            email: "alice@example.com");

        var identity = await validator.ValidateAsync(token);

        Assert.Equal(AuthProviderType.Microsoft, identity.Provider);
        Assert.Equal("alice@example.com", identity.Email);
        Assert.True(identity.EmailVerified);
    }

    [Fact]
    public async Task ValidateAsync_WhenTenantIdIsMissing_ReturnsCredentialInvalidCode()
    {
        var audience = "fd7070f2-af8e-4b10-93d4-5656a0f05503";
        var signingKey = CreateSigningKey();
        var validator = CreateValidator(audience, signingKey);
        var token = CreateToken(signingKey, audience, null, "https://login.microsoftonline.com/common/v2.0", email: "alice@example.com");

        var exception = await Assert.ThrowsAsync<AuthFailureException>(() => validator.ValidateAsync(token));

        Assert.Equal(AuthFailureCodes.ExternalProviderCredentialInvalid, exception.Code);
    }

    [Fact]
    public async Task ValidateAsync_WhenAudienceIsInvalid_ReturnsCredentialInvalidCode()
    {
        var tenantId = "ecc796ef-f71b-44df-84d5-75c420690964";
        var signingKey = CreateSigningKey();
        var validator = CreateValidator("expected-client-id", signingKey);
        var token = CreateToken(signingKey, "different-client-id", tenantId, $"https://login.microsoftonline.com/{tenantId}/v2.0", email: "alice@example.com");

        var exception = await Assert.ThrowsAsync<AuthFailureException>(() => validator.ValidateAsync(token));

        Assert.Equal(AuthFailureCodes.ExternalProviderCredentialInvalid, exception.Code);
    }

    [Fact]
    public async Task ValidateAsync_WhenDerivedIssuerIsInvalid_ReturnsCredentialInvalidCode()
    {
        var tenantId = "ecc796ef-f71b-44df-84d5-75c420690964";
        var audience = "fd7070f2-af8e-4b10-93d4-5656a0f05503";
        var signingKey = CreateSigningKey();
        var validator = CreateValidator(audience, signingKey);
        var token = CreateToken(signingKey, audience, tenantId, "https://login.microsoftonline.com/common/v2.0", email: "alice@example.com");

        var exception = await Assert.ThrowsAsync<AuthFailureException>(() => validator.ValidateAsync(token));

        Assert.Equal(AuthFailureCodes.ExternalProviderCredentialInvalid, exception.Code);
    }

    private static TestMicrosoftExternalAuthProviderValidator CreateValidator(string audience, SecurityKey signingKey)
    {
        var options = Microsoft.Extensions.Options.Options.Create(new BrighterToolsAuthOptions
        {
            ExternalProviders = new ExternalProviderOptions
            {
                Microsoft = new OidcExternalProviderOptions
                {
                    Authority = "https://login.microsoftonline.com/common",
                    MetadataAddress = "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
                    WebClientId = audience
                }
            }
        });

        var configuration = new OpenIdConnectConfiguration();
        configuration.SigningKeys.Add(signingKey);
        return new TestMicrosoftExternalAuthProviderValidator(options, configuration);
    }

    private static SymmetricSecurityKey CreateSigningKey()
        => new(Encoding.UTF8.GetBytes("super-secret-signing-key-1234567890"));

    private static string CreateToken(SecurityKey signingKey, string audience, string? tenantId, string issuer, string? email)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, "microsoft-subject"),
            new("name", "Alice Example")
        };

        if (!string.IsNullOrWhiteSpace(tenantId))
        {
            claims.Add(new Claim("tid", tenantId));
        }

        if (!string.IsNullOrWhiteSpace(email))
        {
            claims.Add(new Claim(JwtRegisteredClaimNames.Email, email));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: DateTime.UtcNow.AddMinutes(-1),
            expires: DateTime.UtcNow.AddMinutes(30),
            signingCredentials: new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private sealed class TestMicrosoftExternalAuthProviderValidator : MicrosoftExternalAuthProviderValidator
    {
        private readonly OpenIdConnectConfiguration _configuration;

        public TestMicrosoftExternalAuthProviderValidator(IOptions<BrighterToolsAuthOptions> options, OpenIdConnectConfiguration configuration)
            : base(options)
        {
            _configuration = configuration;
        }

        protected override Task<OpenIdConnectConfiguration> GetConfigurationAsync(CancellationToken cancellationToken)
            => Task.FromResult(_configuration);
    }
}