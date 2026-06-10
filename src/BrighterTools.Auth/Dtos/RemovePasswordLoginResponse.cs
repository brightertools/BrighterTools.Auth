namespace BrighterTools.Auth.Dtos;

public sealed class RemovePasswordLoginResponse
{
    public bool PasswordRemoved { get; init; }
    public string? Message { get; init; }
}
