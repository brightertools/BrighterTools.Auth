namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents a request from an authenticated user to change their password.
/// </summary>
public sealed class ChangePasswordRequest
{
    /// <summary>
    /// Gets the current password for re-authentication.
    /// </summary>
    public string CurrentPassword { get; init; } = string.Empty;

    /// <summary>
    /// Gets the replacement password.
    /// </summary>
    public string NewPassword { get; init; } = string.Empty;
}
