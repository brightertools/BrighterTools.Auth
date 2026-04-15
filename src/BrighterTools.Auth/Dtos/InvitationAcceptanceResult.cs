namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents the result for invitation Acceptance.
/// </summary>
public sealed class InvitationAcceptanceResult
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
    /// Gets or sets a value indicating whether activated.
    /// </summary>
    public bool Activated { get; init; }
    /// <summary>
    /// Gets or sets the collection of messages.
    /// </summary>
    public IReadOnlyList<string> Messages { get; init; } = [];
    /// <summary>
    /// Gets or sets the collection of metadata.
    /// </summary>
    public IDictionary<string, object?> Metadata { get; init; } = new Dictionary<string, object?>();
}

