namespace BrighterTools.Auth.Options;

/// <summary>
/// Configures onboarding behavior surfaced through the library.
/// </summary>
public sealed class OnboardingOptions
{
    /// <summary>
    /// Gets or sets a value indicating whether onboarding workflows are surfaced through the library.
    /// </summary>
    public bool Enabled { get; set; } = false;
}

