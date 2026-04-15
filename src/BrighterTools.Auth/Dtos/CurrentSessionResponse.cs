namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents the response payload for current Session.
/// </summary>
public sealed class CurrentSessionResponse
{
    /// <summary>
    /// Gets or sets the session.
    /// </summary>
    public AuthSessionResponse? Session { get; init; }
}

