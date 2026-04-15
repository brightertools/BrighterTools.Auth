namespace BrighterTools.Auth.Models;

/// <summary>
/// Represents the mFA Verification Result.
/// </summary>
public sealed class MfaVerificationResult
{
    /// <summary>
    /// Gets or sets a value indicating whether MFA enrollment verification succeeded.
    /// </summary>
    public bool Succeeded { get; init; }
    /// <summary>
    /// Gets or sets the collection of recovery Codes.
    /// </summary>
    public IReadOnlyList<string> RecoveryCodes { get; init; } = [];
}

