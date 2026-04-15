namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents the response payload for mFA Enrollment.
/// </summary>
public sealed class MfaEnrollmentResponse
{
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
    /// <summary>
    /// Gets or sets the collection of recovery Codes.
    /// </summary>
    public IReadOnlyList<string> RecoveryCodes { get; init; } = [];
}

