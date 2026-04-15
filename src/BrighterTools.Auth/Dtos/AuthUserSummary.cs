namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents the user information returned in an authenticated session response.
/// </summary>
public sealed class AuthUserSummary
{
    /// <summary>
    /// Gets the application-owned user identifier.
    /// </summary>
    public string Id { get; init; } = string.Empty;
    /// <summary>
    /// Gets the stable subject identifier associated with the session.
    /// </summary>
    public string SubjectId { get; init; } = string.Empty;
    /// <summary>
    /// Gets the primary email address associated with the user.
    /// </summary>
    public string? Email { get; init; }
    /// <summary>
    /// Gets the username associated with the user, when the host application uses one.
    /// </summary>
    public string? UserName { get; init; }
    /// <summary>
    /// Gets the display name returned in the authenticated session.
    /// </summary>
    public string? DisplayName { get; init; }
}

