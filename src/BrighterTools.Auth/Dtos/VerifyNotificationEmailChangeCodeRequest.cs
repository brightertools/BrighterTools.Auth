namespace BrighterTools.Auth.Dtos;

public sealed class VerifyNotificationEmailChangeCodeRequest
{
    public string ChallengeId { get; init; } = string.Empty;
    public string Code { get; init; } = string.Empty;
}
