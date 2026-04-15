namespace BrighterTools.Auth.Options;

/// <summary>
/// Controls refresh token lifetime and rotation behavior orchestrated by the library.
/// </summary>
public sealed class RefreshTokenOptions
{
    /// <summary>
    /// Gets or sets the lifetime.
    /// </summary>
    public TimeSpan Lifetime { get; set; } = TimeSpan.FromDays(14);
    /// <summary>
    /// Gets or sets a value indicating whether refresh tokens should be rotated when they are exchanged.
    /// </summary>
    public bool RotateOnRefresh { get; set; } = true;
    /// <summary>
    /// Gets or sets a value indicating whether reuse of a revoked token ancestor should revoke the active token family.
    /// </summary>
    public bool RevokeOnUseOfRevokedAncestor { get; set; } = true;
}

