namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents a short-lived mobile-to-web handoff code.
/// </summary>
public sealed class MobileWebHandoffResponse
{
    /// <summary>
    /// Gets the one-time code to exchange in the web session.
    /// </summary>
    public string Code { get; init; } = string.Empty;

    /// <summary>
    /// Gets the expiry timestamp for the one-time code.
    /// </summary>
    public DateTimeOffset ExpiresAtUtc { get; init; }
}
