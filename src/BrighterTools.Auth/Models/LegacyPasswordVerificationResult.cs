namespace BrighterTools.Auth.Models;

/// <summary>
/// Represents the legacy Password Verification Result.
/// </summary>
public sealed class LegacyPasswordVerificationResult
{
    /// <summary>
    /// Gets or sets a value indicating whether legacy password verification succeeded.
    /// </summary>
    public bool Succeeded { get; init; }
    /// <summary>
    /// Gets or sets a value indicating whether the legacy password hash should be upgraded.
    /// </summary>
    public bool RequiresUpgrade { get; init; }
    /// <summary>
    /// Gets or sets the upgraded Hash.
    /// </summary>
    public string? UpgradedHash { get; init; }
}

