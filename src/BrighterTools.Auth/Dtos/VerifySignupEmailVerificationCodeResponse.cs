namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents the result of verifying a signup email code.
/// </summary>
public sealed class VerifySignupEmailVerificationCodeResponse
{
    /// <summary>
    /// Gets the verified challenge identifier.
    /// </summary>
    public string ChallengeId { get; init; } = string.Empty;

    /// <summary>
    /// Gets the normalized verified email address.
    /// </summary>
    public string Email { get; init; } = string.Empty;

    /// <summary>
    /// Gets a value indicating whether the email was verified.
    /// </summary>
    public bool EmailVerified { get; init; }

    /// <summary>
    /// Gets a user-facing status message.
    /// </summary>
    public string Message { get; init; } = string.Empty;
}
