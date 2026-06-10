namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents the result of changing an authenticated user's password.
/// </summary>
public sealed class ChangePasswordResponse
{
    /// <summary>
    /// Gets a value indicating whether the password was changed.
    /// </summary>
    public bool PasswordChanged { get; init; }

    /// <summary>
    /// Gets a user-facing status message.
    /// </summary>
    public string Message { get; init; } = string.Empty;
}
