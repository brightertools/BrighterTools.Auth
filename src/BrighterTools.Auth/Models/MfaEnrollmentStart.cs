namespace BrighterTools.Auth.Models;

/// <summary>
/// Represents the mFA Enrollment Start.
/// </summary>
public sealed class MfaEnrollmentStart
{
    /// <summary>
    /// Gets or sets the user ID.
    /// </summary>
    public string UserId { get; init; } = string.Empty;
    /// <summary>
    /// Gets or sets the secret.
    /// </summary>
    public string Secret { get; init; } = string.Empty;
    /// <summary>
    /// Gets or sets the oTP auth Uri.
    /// </summary>
    public string OtpauthUri { get; init; } = string.Empty;
    /// <summary>
    /// Gets or sets the qr Code Svg.
    /// </summary>
    public string QrCodeSvg { get; init; } = string.Empty;
}

