namespace BrighterTools.Auth.Dtos;

public sealed class VerifyLoginEmailChangeCodeRequest
{
    public string? ChallengeId { get; init; }
    public string Code { get; init; } = string.Empty;
}
