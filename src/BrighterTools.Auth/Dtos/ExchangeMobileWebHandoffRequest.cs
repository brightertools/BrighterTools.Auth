namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents a request to exchange a mobile handoff code for a web authentication session.
/// </summary>
public sealed class ExchangeMobileWebHandoffRequest
{
    /// <summary>
    /// Gets the one-time handoff code.
    /// </summary>
    public string Code { get; init; } = string.Empty;
}
