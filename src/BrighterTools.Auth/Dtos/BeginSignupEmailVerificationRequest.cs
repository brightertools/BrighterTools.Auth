namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents a request to start email verification before password signup.
/// </summary>
public sealed class BeginSignupEmailVerificationRequest
{
    /// <summary>
    /// Gets the email address to verify for signup.
    /// </summary>
    public string Email { get; init; } = string.Empty;
}
