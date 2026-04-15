namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents the response payload for auth.
/// </summary>
public sealed class AuthResponse
{
    /// <summary>
    /// Gets the current auth session details when a session was issued.
    /// </summary>
    public AuthSessionResponse? Session { get; init; }

    /// <summary>
    /// Gets a value indicating whether the resolved session still requires onboarding.
    /// </summary>
    public bool RequiresOnboarding => Session?.Onboarding.Required ?? false;
}

