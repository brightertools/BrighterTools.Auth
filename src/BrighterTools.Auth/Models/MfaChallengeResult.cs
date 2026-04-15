namespace BrighterTools.Auth.Models;

/// <summary>
/// Represents the mFA Challenge Result.
/// </summary>
public sealed class MfaChallengeResult
{
    /// <summary>
    /// Gets or sets a value indicating whether the MFA challenge succeeded.
    /// </summary>
    public bool Succeeded { get; init; }
    /// <summary>
    /// Gets or sets a value indicating whether a recovery code was used.
    /// </summary>
    public bool UsedRecoveryCode { get; init; }
}

