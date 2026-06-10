namespace BrighterTools.Auth.Dtos;

public sealed class ConfirmLoginEmailChangeRequest
{
    public string Token { get; init; } = string.Empty;
}
