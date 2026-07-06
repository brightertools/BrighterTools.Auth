namespace BrighterTools.Auth.Options;

/// <summary>
/// Configures optional age-gate validation during signup.
/// </summary>
public sealed class SignupAgeGateOptions
{
    /// <summary>
    /// Gets or sets a value indicating whether signup age-gate validation is enabled.
    /// </summary>
    public bool Enabled { get; set; }

    /// <summary>
    /// Gets or sets the minimum age required to create an account.
    /// </summary>
    public int MinimumAge { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether date of birth must be supplied during signup.
    /// </summary>
    public bool RequireDateOfBirth { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether users must explicitly confirm they meet the minimum age.
    /// </summary>
    public bool RequireMinimumAgeConfirmation { get; set; }
}
