namespace BrighterTools.Auth.Models;

/// <summary>
/// Represents the refresh Token Issue Request.
/// </summary>
public sealed class RefreshTokenIssueRequest
{
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
    /// Gets or sets the issued At Utc.
    /// </summary>
    public DateTimeOffset IssuedAtUtc { get; init; }
    /// <summary>
    /// Gets or sets the expires At Utc.
    /// </summary>
    public DateTimeOffset ExpiresAtUtc { get; init; }
}

