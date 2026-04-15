namespace BrighterTools.Auth.Models;

/// <summary>
/// Represents the auth Refresh Token.
/// </summary>
public sealed class AuthRefreshToken
{
    /// <summary>
    /// Gets or sets the token.
    /// </summary>
    public string Token { get; init; } = string.Empty;
    /// <summary>
    /// Gets or sets the user ID.
    /// </summary>
    public string UserId { get; init; } = string.Empty;
    /// <summary>
    /// Gets or sets the tenant ID.
    /// </summary>
    public string? TenantId { get; init; }
    /// <summary>
    /// Gets or sets the provider.
    /// </summary>
    public AuthProviderType Provider { get; init; }
    /// <summary>
    /// Gets or sets the expires At Utc.
    /// </summary>
    public DateTimeOffset ExpiresAtUtc { get; init; }
    /// <summary>
    /// Gets or sets the created At Utc.
    /// </summary>
    public DateTimeOffset CreatedAtUtc { get; init; }
    /// <summary>
    /// Gets or sets a value indicating whether is Revoked.
    /// </summary>
    public bool IsRevoked { get; init; }
    /// <summary>
    /// Gets or sets the replaced By Token.
    /// </summary>
    public string? ReplacedByToken { get; init; }
}

