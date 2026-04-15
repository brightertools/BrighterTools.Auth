namespace BrighterTools.Auth.Options;

/// <summary>
/// Groups the configurable behaviors exposed by BrighterTools.Auth.
/// </summary>
public sealed class BrighterToolsAuthOptions
{
    /// <summary>
    /// Gets the configuration section name used for option binding.
    /// </summary>
    public const string SectionName = "BrighterToolsAuth";

    /// <summary>
    /// Gets or sets the access token settings that a host token issuer may choose to honor.
    /// </summary>
    public JwtOptions Jwt { get; set; } = new();

    /// <summary>
    /// Gets or sets the refresh token settings used by the orchestration layer.
    /// </summary>
    public RefreshTokenOptions RefreshTokens { get; set; } = new();

    /// <summary>
    /// Gets or sets the enabled login provider configuration.
    /// </summary>
    public ProviderOptions Providers { get; set; } = new();

    /// <summary>
    /// Gets or sets the MFA configuration surfaced through the library.
    /// </summary>
    public MfaOptions Mfa { get; set; } = new();

    /// <summary>
    /// Gets or sets the onboarding configuration surfaced through the library.
    /// </summary>
    public OnboardingOptions Onboarding { get; set; } = new();

    /// <summary>
    /// Gets or sets the legacy password migration behavior.
    /// </summary>
    public PasswordMigrationOptions PasswordMigration { get; set; } = new();
}

