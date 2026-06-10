namespace BrighterTools.Auth.Dtos;

public sealed class CompletePasswordSetupResponse
{
    public string Email { get; init; } = string.Empty;
    public bool HasPassword { get; init; }
    public string? Message { get; init; }
}
