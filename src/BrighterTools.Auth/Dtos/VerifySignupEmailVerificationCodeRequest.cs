namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents a request to verify a signup email code.
/// </summary>
public sealed class VerifySignupEmailVerificationCodeRequest
{
    /// <summary>
    /// Gets the challenge identifier returned by the begin call.
    /// </summary>
    public string ChallengeId { get; init; } = string.Empty;

    /// <summary>
    /// Gets the email address being verified.
    /// </summary>
    public string Email { get; init; } = string.Empty;

    /// <summary>
    /// Gets the verification code entered by the user.
    /// </summary>
    public string Code { get; init; } = string.Empty;
}
