namespace BrighterTools.Auth.Models;

/// <summary>
/// Represents the mFA Enrollment.
/// </summary>
public sealed class MfaEnrollment
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
    /// Gets or sets a value indicating whether the MFA enrollment has been confirmed.
    /// </summary>
    public bool Confirmed { get; init; }
    /// <summary>
    /// Gets or sets the created At Utc.
    /// </summary>
    public DateTimeOffset CreatedAtUtc { get; init; }
}

