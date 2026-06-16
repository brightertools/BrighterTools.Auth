namespace BrighterTools.Auth.Dtos;

public sealed class ConfirmNotificationEmailChangeRequest
{
    public string Token { get; init; } = string.Empty;
}
