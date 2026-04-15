namespace BrighterTools.Auth.Models;

/// <summary>
/// Represents the auth Tenant Membership.
/// </summary>
public sealed class AuthTenantMembership
{
    /// <summary>
    /// Gets or sets the tenant ID.
    /// </summary>
    public string TenantId { get; init; } = string.Empty;
    /// <summary>
    /// Gets or sets the tenant Key.
    /// </summary>
    public string? TenantKey { get; init; }
    /// <summary>
    /// Gets or sets the tenant Name.
    /// </summary>
    public string TenantName { get; init; } = string.Empty;
    /// <summary>
    /// Gets or sets the role.
    /// </summary>
    public string Role { get; init; } = string.Empty;
    /// <summary>
    /// Gets or sets a value indicating whether the tenant membership is the current tenant context.
    /// </summary>
    public bool IsCurrent { get; init; }
    /// <summary>
    /// Gets or sets a value indicating whether login is enabled for the tenant membership.
    /// </summary>
    public bool LoginEnabled { get; init; } = true;
    /// <summary>
    /// Gets or sets a value indicating whether email-based features are enabled for the tenant membership.
    /// </summary>
    public bool EmailEnabled { get; init; } = true;
    /// <summary>
    /// Gets or sets a value indicating whether the user owns the tenant membership.
    /// </summary>
    public bool IsOwner { get; init; }
    /// <summary>
    /// Gets or sets the collection of metadata.
    /// </summary>
    public IDictionary<string, object?> Metadata { get; init; } = new Dictionary<string, object?>();
}

