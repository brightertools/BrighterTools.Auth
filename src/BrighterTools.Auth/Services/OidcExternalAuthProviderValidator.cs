using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Models;
using BrighterTools.Auth.Options;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace BrighterTools.Auth.Services;

/// <summary>
/// Validates OpenID Connect identity tokens and maps them to a normalized external identity.
/// </summary>
public abstract class OidcExternalAuthProviderValidator : IExternalAuthProviderValidator
{
    private readonly ConfigurationManager<OpenIdConnectConfiguration> _configurationManager;
    private readonly OidcExternalProviderOptions _options;

    /// <summary>
    /// Initializes a new instance of the OidcExternalAuthProviderValidator class.
    /// </summary>
    /// <param name="options">The provider validation options.</param>
    protected OidcExternalAuthProviderValidator(OidcExternalProviderOptions options)
    {
        _options = options;
        var retriever = new HttpDocumentRetriever { RequireHttps = true };
        _configurationManager = new ConfigurationManager<OpenIdConnectConfiguration>(
            _options.MetadataAddress,
            new OpenIdConnectConfigurationRetriever(),
            retriever);
    }

    /// <inheritdoc />
    public abstract AuthProviderType Provider { get; }

    /// <inheritdoc />
    public async Task<ExternalIdentity> ValidateAsync(string credential, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(credential))
        {
            throw new InvalidOperationException("External credential is required.");
        }

        if (string.IsNullOrWhiteSpace(_options.Issuer))
        {
            throw new InvalidOperationException($"Issuer is not configured for provider '{Provider}'.");
        }

        if (string.IsNullOrWhiteSpace(_options.MetadataAddress))
        {
            throw new InvalidOperationException($"MetadataAddress is not configured for provider '{Provider}'.");
        }

        var validationAudiences = _options.ValidationAudiences;
        if (validationAudiences.Count == 0)
        {
            throw new InvalidOperationException($"At least one audience/client ID must be configured for provider '{Provider}'.");
        }

        var configuration = await _configurationManager.GetConfigurationAsync(cancellationToken);
        var handler = new JwtSecurityTokenHandler();
        var principal = handler.ValidateToken(credential, new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = _options.Issuer,
            ValidateAudience = true,
            ValidAudiences = validationAudiences,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKeys = configuration.SigningKeys,
            ClockSkew = TimeSpan.FromMinutes(5),
            NameClaimType = "name",
            RoleClaimType = ClaimTypes.Role
        }, out _);

        var subject = principal.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(subject))
        {
            throw new InvalidOperationException($"Provider '{Provider}' token did not include a subject.");
        }

        var email = principal.FindFirstValue(JwtRegisteredClaimNames.Email) ?? principal.FindFirstValue(ClaimTypes.Email);
        var displayName = principal.FindFirstValue("name") ?? principal.FindFirstValue(ClaimTypes.Name);
        var emailVerified = ReadBooleanClaim(principal, "email_verified");

        return new ExternalIdentity
        {
            Provider = Provider,
            ProviderSubject = subject,
            Email = email,
            DisplayName = displayName,
            EmailVerified = emailVerified,
            Claims = principal.Claims.ToDictionary(claim => claim.Type, claim => (object?)claim.Value)
        };
    }

    private static bool ReadBooleanClaim(ClaimsPrincipal principal, string claimType)
    {
        var value = principal.FindFirstValue(claimType);
        return bool.TryParse(value, out var parsed) && parsed;
    }
}