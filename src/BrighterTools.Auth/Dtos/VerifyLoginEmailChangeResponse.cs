namespace BrighterTools.Auth.Dtos;

public sealed class VerifyLoginEmailChangeResponse
{
    public string Email { get; init; } = string.Empty;
    public bool EmailVerified { get; init; }
    public string? Message { get; init; }
}
