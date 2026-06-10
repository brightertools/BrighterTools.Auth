namespace BrighterTools.Auth.Options;

/// <summary>
/// Controls external sign-up security behavior.
/// </summary>
public sealed class ExternalSignupOptions
{
    /// <summary>
    /// Gets or sets a value indicating whether external sign-up requires terms acceptance.
    /// </summary>
    public bool RequireTermsAcceptance { get; set; } = true;

    /// <summary>
    /// Gets or sets a value indicating whether external sign-up requires privacy policy acceptance.
    /// </summary>
    public bool RequirePrivacyPolicyAcceptance { get; set; } = true;

    /// <summary>
    /// Gets or sets a value indicating whether external providers must assert a verified email.
    /// </summary>
    public bool RequireVerifiedEmail { get; set; } = true;

    /// <summary>
    /// Gets or sets a value indicating whether external login may provision users.
    /// Prefer explicit sign-up flows for public apps.
    /// </summary>
    public bool AllowProvisioningFromLogin { get; set; }
}
