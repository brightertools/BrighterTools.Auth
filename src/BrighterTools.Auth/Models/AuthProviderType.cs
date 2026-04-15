namespace BrighterTools.Auth.Models;

/// <summary>
/// Specifies the supported auth Provider type values.
/// </summary>
public enum AuthProviderType
{
    /// <summary>
    /// Represents an unspecified authentication provider.
    /// </summary>
    Unknown = 0,
    /// <summary>
    /// Represents password-based authentication.
    /// </summary>
    Password = 1,
    /// <summary>
    /// Represents Google authentication.
    /// </summary>
    Google = 2,
    /// <summary>
    /// Represents Apple authentication.
    /// </summary>
    Apple = 3,
    /// <summary>
    /// Represents Microsoft authentication.
    /// </summary>
    Microsoft = 4,
    /// <summary>
    /// Represents passkey-based authentication.
    /// </summary>
    Passkey = 5
}

