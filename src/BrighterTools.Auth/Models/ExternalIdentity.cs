namespace BrighterTools.Auth.Models;

/// <summary>
/// Represents the external Identity.
/// </summary>
public sealed class ExternalIdentity
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
    /// Gets or sets the display Name.
    /// </summary>
    public string? DisplayName { get; init; }
    /// <summary>
    /// Gets or sets a value indicating whether the external provider verified the email address.
    /// </summary>
    public bool EmailVerified { get; init; }
    /// <summary>
    /// Gets or sets the collection of claims.
    /// </summary>
    public IDictionary<string, object?> Claims { get; init; } = new Dictionary<string, object?>();
}

