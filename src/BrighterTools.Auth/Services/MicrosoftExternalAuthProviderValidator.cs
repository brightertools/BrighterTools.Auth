using BrighterTools.Auth.Models;
using BrighterTools.Auth.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace BrighterTools.Auth.Services;

/// <summary>
/// Validates Microsoft identity tokens for multitenant and personal-account sign-in.
/// </summary>
public class MicrosoftExternalAuthProviderValidator : OidcExternalAuthProviderValidator
{
    private const string ConsumerTenantId = "9188040d-6c67-4c5b-b112-36a304b66dad";
    private static readonly HashSet<string> ConsumerIssuerHosts = new(StringComparer.OrdinalIgnoreCase)
    {
        "login.microsoftonline.com",
        "login.live.com"
    };

    public MicrosoftExternalAuthProviderValidator(IOptions<BrighterToolsAuthOptions> options)
        : base(options.Value.ExternalProviders.Microsoft)
    {
    }

    /// <inheritdoc />
    public override AuthProviderType Provider => AuthProviderType.Microsoft;

    /// <inheritdoc />
    protected override bool RequiresStaticIssuer => false;

    /// <inheritdoc />
    protected override TokenValidationParameters CreateTokenValidationParameters(OpenIdConnectConfiguration configuration)
    {
        var parameters = base.CreateTokenValidationParameters(configuration);
        parameters.ValidateIssuer = false;
        return parameters;
    }

    /// <inheritdoc />
    protected override void ValidatePrincipal(ClaimsPrincipal principal)
    {
        var issuer = principal.FindFirstValue(JwtRegisteredClaimNames.Iss) ?? principal.FindFirstValue("iss");
        if (string.IsNullOrWhiteSpace(issuer))
        {
            throw new InvalidOperationException("Provider 'Microsoft' token did not include an issuer.");
        }

        var tenantId = principal.FindFirstValue("tid") ?? principal.FindFirstValue("http://schemas.microsoft.com/identity/claims/tenantid");
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            throw new InvalidOperationException("Provider 'Microsoft' token did not include a tenant id.");
        }

        if (!IsIssuerValidForTenant(issuer, tenantId))
        {
            throw new SecurityTokenInvalidIssuerException("Provider 'Microsoft' token issuer is invalid.");
        }
    }

    /// <inheritdoc />
    protected override ExternalIdentity BuildExternalIdentity(ClaimsPrincipal principal)
    {
        var identity = base.BuildExternalIdentity(principal);
        var email = principal.FindFirstValue(JwtRegisteredClaimNames.Email) ?? principal.FindFirstValue(ClaimTypes.Email);

        return new ExternalIdentity
        {
            Provider = Provider,
            ProviderSubject = identity.ProviderSubject,
            Email = string.IsNullOrWhiteSpace(email) ? null : email,
            DisplayName = identity.DisplayName,
            EmailVerified = !string.IsNullOrWhiteSpace(email),
            Claims = identity.Claims
        };
    }

    private static bool IsIssuerValidForTenant(string issuer, string tenantId)
    {
        if (!Uri.TryCreate(issuer, UriKind.Absolute, out var uri))
        {
            return false;
        }

        var normalizedTenantId = tenantId.Trim().ToLowerInvariant();
        var normalizedPath = uri.AbsolutePath.TrimEnd('/').ToLowerInvariant();

        if (normalizedTenantId.Equals(ConsumerTenantId, StringComparison.OrdinalIgnoreCase))
        {
            if (!ConsumerIssuerHosts.Contains(uri.Host))
            {
                return false;
            }

            return normalizedPath is "/consumers/v2.0"
                or "/consumers"
                or "/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0"
                or "/9188040d-6c67-4c5b-b112-36a304b66dad";
        }

        if (!uri.Host.Equals("login.microsoftonline.com", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return normalizedPath == $"/{normalizedTenantId}/v2.0"
            || normalizedPath == $"/{normalizedTenantId}";
    }
}