namespace BrighterTools.Auth.Models;

/// <summary>
/// Represents the external Login.
/// </summary>
public sealed class ExternalLogin
{
    /// <summary>
    /// Gets or sets the provider.
    /// </summary>
    public AuthProviderType Provider { get; init; }
    /// <summary>
    /// Gets or sets the provider Subject.
    /// </summary>
    public string ProviderSubject { get; init; } = string.Empty;
    /// <summary>
    /// Gets or sets the email.
    /// </summary>
    public string? Email { get; init; }
    /// <summary>
    /// Gets or sets the linked At Utc.
    /// </summary>
    public DateTimeOffset LinkedAtUtc { get; init; }
}

