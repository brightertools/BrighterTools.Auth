namespace BrighterTools.Auth.Models;

/// <summary>
/// Represents the password Verification Result.
/// </summary>
public sealed class PasswordVerificationResult
{
    /// <summary>
    /// Gets or sets a value indicating whether password verification succeeded.
    /// </summary>
    public bool Succeeded { get; init; }
    /// <summary>
    /// Gets or sets a value indicating whether the password hash should be rehashed.
    /// </summary>
    public bool RequiresRehash { get; init; }
    /// <summary>
    /// Gets or sets the failure Reason.
    /// </summary>
    public string? FailureReason { get; init; }

    /// <summary>
    /// Creates a successful password verification result.
    /// </summary>
    public static PasswordVerificationResult Success(bool requiresRehash = false) => new() { Succeeded = true, RequiresRehash = requiresRehash };
    /// <summary>
    /// Creates a failed password verification result.
    /// </summary>
    public static PasswordVerificationResult Failed(string reason) => new() { Succeeded = false, FailureReason = reason };
}

