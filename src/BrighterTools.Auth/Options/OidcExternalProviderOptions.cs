namespace BrighterTools.Auth.Options;

/// <summary>
/// Describes OpenID Connect identity-token validation settings for an external provider.
/// </summary>
public sealed class OidcExternalProviderOptions
{
    /// <summary>
    /// Gets or sets the expected token issuer.
    /// </summary>
    public string Issuer { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the OpenID Connect metadata endpoint used to discover signing keys.
    /// </summary>
    public string MetadataAddress { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the browser-facing client ID used by web login buttons when it differs from the accepted validation audiences.
    /// </summary>
    public string WebClientId { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets accepted client IDs / audiences for this provider.
    /// </summary>
    public ISet<string> Audiences { get; set; } = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Gets the audiences accepted during token validation, including the optional web client ID.
    /// </summary>
    public IReadOnlyCollection<string> ValidationAudiences
    {
        get
        {
            var audiences = new HashSet<string>(Audiences.Where(audience => !string.IsNullOrWhiteSpace(audience)), StringComparer.OrdinalIgnoreCase);
            if (!string.IsNullOrWhiteSpace(WebClientId))
            {
                audiences.Add(WebClientId);
            }

            return audiences.ToArray();
        }
    }
}