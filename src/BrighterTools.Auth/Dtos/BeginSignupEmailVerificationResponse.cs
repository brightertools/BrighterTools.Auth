namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents a signup email verification challenge response.
/// </summary>
public sealed class BeginSignupEmailVerificationResponse
{
    /// <summary>
    /// Gets the challenge identifier required when verifying the code.
    /// </summary>
    public string ChallengeId { get; init; } = string.Empty;

    /// <summary>
    /// Gets the normalized email address being verified.
    /// </summary>
    public string Email { get; init; } = string.Empty;

    /// <summary>
    /// Gets a value indicating whether a verification code was sent.
    /// </summary>
    public bool CodeSent { get; init; }

    /// <summary>
    /// Gets the UTC expiry for this challenge.
    /// </summary>
    public DateTime ExpiresAtUtc { get; init; }

    /// <summary>
    /// Gets a user-facing status message.
    /// </summary>
    public string Message { get; init; } = string.Empty;
}
