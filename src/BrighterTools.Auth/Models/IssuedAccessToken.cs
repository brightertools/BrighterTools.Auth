namespace BrighterTools.Auth.Models;

/// <summary>
/// Represents the issued Access Token.
/// </summary>
public sealed class IssuedAccessToken
{
    /// <summary>
    /// Gets or sets the token.
    /// </summary>
    public string Token { get; init; } = string.Empty;
    /// <summary>
    /// Gets or sets the expires At Utc.
    /// </summary>
    public DateTimeOffset ExpiresAtUtc { get; init; }
}

