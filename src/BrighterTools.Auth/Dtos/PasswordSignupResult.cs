namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents the result for password Signup.
/// </summary>
public sealed class PasswordSignupResult
{
    /// <summary>
    /// Gets or sets the user ID.
    /// </summary>
    public string? UserId { get; init; }
    /// <summary>
    /// Gets or sets the auth.
    /// </summary>
    public AuthResponse? Auth { get; init; }
    /// <summary>
    /// Gets or sets a value indicating whether requires Email Verification.
    /// </summary>
    public bool RequiresEmailVerification { get; init; }
    /// <summary>
    /// Gets or sets the collection of messages.
    /// </summary>
    public IReadOnlyList<string> Messages { get; init; } = [];
    /// <summary>
    /// Gets or sets the collection of metadata.
    /// </summary>
    public IDictionary<string, object?> Metadata { get; init; } = new Dictionary<string, object?>();
}

