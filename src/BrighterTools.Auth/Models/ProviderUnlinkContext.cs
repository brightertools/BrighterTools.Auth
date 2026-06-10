namespace BrighterTools.Auth.Models;

/// <summary>
/// Carries the current login-provider state for an unlink request.
/// </summary>
public sealed class ProviderUnlinkContext
{
    /// <summary>
    /// Gets the user requesting the unlink operation.
    /// </summary>
    public AuthUser User { get; init; } = new();

    /// <summary>
    /// Gets the provider being removed.
    /// </summary>
    public AuthProviderType Provider { get; init; }

    /// <summary>
    /// Gets the provider subject being removed.
    /// </summary>
    public string ProviderSubject { get; init; } = string.Empty;

    /// <summary>
    /// Gets the external logins currently linked to the user.
    /// </summary>
    public IReadOnlyList<ExternalLogin> LinkedLogins { get; init; } = [];
}
