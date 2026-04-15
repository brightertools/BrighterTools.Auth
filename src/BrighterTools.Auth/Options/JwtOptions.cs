namespace BrighterTools.Auth.Options;

/// <summary>
/// Describes the access token settings that a host token issuer may choose to honor.
/// </summary>
public sealed class JwtOptions
{
    /// <summary>
    /// Gets or sets the issuer value that a host token issuer may embed in access tokens.
    /// </summary>
    public string Issuer { get; set; } = string.Empty;
    /// <summary>
    /// Gets or sets the audience value that a host token issuer may embed in access tokens.
    /// </summary>
    public string Audience { get; set; } = string.Empty;
    /// <summary>
    /// Gets or sets the access Token Lifetime.
    /// </summary>
    public TimeSpan AccessTokenLifetime { get; set; } = TimeSpan.FromMinutes(15);
}

