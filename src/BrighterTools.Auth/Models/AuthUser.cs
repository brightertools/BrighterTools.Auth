namespace BrighterTools.Auth.Models;

/// <summary>
/// Represents the host-owned user shape consumed by authentication workflows.
/// </summary>
public sealed class AuthUser
{
    /// <summary>
    /// Gets the application-owned user identifier.
    /// </summary>
    public string Id { get; init; } = string.Empty;
    /// <summary>
    /// Gets the stable subject identifier used when issuing access tokens.
    /// </summary>
    public string SubjectId { get; init; } = string.Empty;
    /// <summary>
    /// Gets the primary email address associated with the user.
    /// </summary>
    public string? Email { get; init; }
    /// <summary>
    /// Gets the username associated with the user, when the host application uses one.
    /// </summary>
    public string? UserName { get; init; }
    /// <summary>
    /// Gets the display name that should appear in authenticated session payloads.
    /// </summary>
    public string? DisplayName { get; init; }
    /// <summary>
    /// Gets a value indicating whether the user's email address has already been verified.
    /// </summary>
    public bool EmailVerified { get; init; }
    /// <summary>
    /// Gets a value indicating whether the user is currently allowed to authenticate.
    /// </summary>
    public bool CanSignIn { get; init; } = true;
    /// <summary>
    /// Gets the current password hash stored for the user.
    /// </summary>
    public string? PasswordHash { get; init; }
    /// <summary>
    /// Gets the identifier of the password hashing algorithm currently associated with the stored hash.
    /// </summary>
    public string? PasswordAlgorithm { get; init; }
    /// <summary>
    /// Gets the tenant memberships available to the user.
    /// </summary>
    public IReadOnlyList<AuthTenantMembership> TenantMemberships { get; init; } = [];
    /// <summary>
    /// Gets the login providers explicitly enabled for the user.
    /// </summary>
    public IReadOnlyList<AuthProviderType> EnabledProviders { get; init; } = [];
    /// <summary>
    /// Gets the host-defined payload values that may be projected into tokens or session responses.
    /// </summary>
    public IDictionary<string, object?> CustomPayload { get; init; } = new Dictionary<string, object?>();
}

