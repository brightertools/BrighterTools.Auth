namespace BrighterTools.Auth.Options;

/// <summary>
/// Groups external identity provider validation settings.
/// </summary>
public sealed class ExternalProviderOptions
{
    /// <summary>
    /// Gets or sets Sign in with Apple token validation settings.
    /// </summary>
    public OidcExternalProviderOptions Apple { get; set; } = new()
    {
        Issuer = "https://appleid.apple.com",
        MetadataAddress = "https://appleid.apple.com/.well-known/openid-configuration"
    };

    /// <summary>
    /// Gets or sets Google identity token validation settings.
    /// </summary>
    public OidcExternalProviderOptions Google { get; set; } = new()
    {
        Issuer = "https://accounts.google.com",
        MetadataAddress = "https://accounts.google.com/.well-known/openid-configuration"
    };
}