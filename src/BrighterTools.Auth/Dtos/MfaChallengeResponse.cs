namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents the response payload for mFA Challenge.
/// </summary>
public sealed class MfaChallengeResponse
{
    /// <summary>
    /// Gets or sets a value indicating whether succeeded.
    /// </summary>
    public bool Succeeded { get; init; }
    /// <summary>
    /// Gets or sets a value indicating whether used Recovery Code.
    /// </summary>
    public bool UsedRecoveryCode { get; init; }
}

