using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Constants;
using BrighterTools.Auth.Exceptions;
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

    /// <summary>
    /// Gets the configured provider options.
    /// </summary>
    protected OidcExternalProviderOptions Options => _options;

    /// <summary>
    /// Gets a value indicating whether the provider requires a statically configured issuer.
    /// </summary>
    protected virtual bool RequiresStaticIssuer => true;

    /// <inheritdoc />
    public async Task<ExternalIdentity> ValidateAsync(string credential, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(credential))
        {
            throw new InvalidOperationException("External credential is required.");
        }

        ValidateProviderOptions();

        OpenIdConnectConfiguration configuration;
        try
        {
            configuration = await GetConfigurationAsync(cancellationToken);
        }
        catch (AuthFailureException)
        {
            throw;
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            throw new AuthFailureException(
                AuthFailureCodes.ExternalProviderMisconfigured,
                GetProviderMisconfiguredMessage(),
                exception);
        }

        try
        {
            var handler = new JwtSecurityTokenHandler();
            var principal = handler.ValidateToken(credential, CreateTokenValidationParameters(configuration), out _);

            ValidatePrincipal(principal);
            return BuildExternalIdentity(principal);
        }
        catch (AuthFailureException)
        {
            throw;
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            throw new AuthFailureException(
                AuthFailureCodes.ExternalProviderCredentialInvalid,
                GetCredentialInvalidMessage(),
                exception);
        }
    }

    /// <summary>
    /// Retrieves the provider metadata and signing configuration.
    /// </summary>
    protected virtual Task<OpenIdConnectConfiguration> GetConfigurationAsync(CancellationToken cancellationToken)
        => _configurationManager.GetConfigurationAsync(cancellationToken);

    /// <summary>
    /// Creates token validation parameters for the provider.
    /// </summary>
    protected virtual TokenValidationParameters CreateTokenValidationParameters(OpenIdConnectConfiguration configuration)
        => new()
        {
            ValidateIssuer = RequiresStaticIssuer,
            ValidIssuer = RequiresStaticIssuer ? _options.Issuer : null,
            ValidateAudience = true,
            ValidAudiences = _options.ValidationAudiences,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKeys = configuration.SigningKeys,
            ClockSkew = TimeSpan.FromMinutes(5),
            NameClaimType = "name",
            RoleClaimType = ClaimTypes.Role
        };

    /// <summary>
    /// Performs provider-specific post-validation checks.
    /// </summary>
    protected virtual void ValidatePrincipal(ClaimsPrincipal principal)
    {
    }

    /// <summary>
    /// Maps a validated principal to a normalized external identity.
    /// </summary>
    protected virtual ExternalIdentity BuildExternalIdentity(ClaimsPrincipal principal)
    {
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

    /// <summary>
    /// Returns the user-facing message used when provider validation configuration is invalid.
    /// </summary>
    protected virtual string GetProviderMisconfiguredMessage()
        => $"{Provider} sign-in is not configured correctly.";

    /// <summary>
    /// Returns the user-facing message used when a provider credential cannot be validated.
    /// </summary>
    protected virtual string GetCredentialInvalidMessage()
        => $"{Provider} sign-in could not be verified.";

    private void ValidateProviderOptions()
    {
        if (RequiresStaticIssuer && string.IsNullOrWhiteSpace(_options.Issuer))
        {
            throw new AuthFailureException(
                AuthFailureCodes.ExternalProviderMisconfigured,
                $"Issuer is not configured for provider '{Provider}'.");
        }

        if (string.IsNullOrWhiteSpace(_options.MetadataAddress))
        {
            throw new AuthFailureException(
                AuthFailureCodes.ExternalProviderMisconfigured,
                $"MetadataAddress is not configured for provider '{Provider}'.");
        }

        var validationAudiences = _options.ValidationAudiences;
        if (validationAudiences.Count == 0)
        {
            throw new AuthFailureException(
                AuthFailureCodes.ExternalProviderMisconfigured,
                $"At least one audience/client ID must be configured for provider '{Provider}'.");
        }
    }

    private static bool ReadBooleanClaim(ClaimsPrincipal principal, string claimType)
    {
        var value = principal.FindFirstValue(claimType);
        return bool.TryParse(value, out var parsed) && parsed;
    }
}