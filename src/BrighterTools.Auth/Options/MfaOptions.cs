namespace BrighterTools.Auth.Options;

/// <summary>
/// Configures MFA features that the host application chooses to expose through the library.
/// </summary>
public sealed class MfaOptions
{
    /// <summary>
    /// Gets or sets a value indicating whether MFA features are enabled for the consuming application.
    /// </summary>
    public bool Enabled { get; set; } = false;
    /// <summary>
    /// Gets or sets the number of recovery codes issued when MFA enrollment is completed.
    /// </summary>
    public int RecoveryCodeCount { get; set; } = 8;
    /// <summary>
    /// Gets or sets the issuer name shown by authenticator applications.
    /// </summary>
    public string Issuer { get; set; } = string.Empty;
}

