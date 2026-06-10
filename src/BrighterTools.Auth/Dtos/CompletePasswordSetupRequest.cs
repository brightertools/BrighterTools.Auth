namespace BrighterTools.Auth.Dtos;

public sealed class CompletePasswordSetupRequest
{
    public string Email { get; init; } = string.Empty;
    public string NewPassword { get; init; } = string.Empty;
}
