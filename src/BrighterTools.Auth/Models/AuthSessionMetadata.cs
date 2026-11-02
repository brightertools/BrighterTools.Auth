namespace BrighterTools.Auth.Models;

/// <summary>Non-secret correlation established before signing an access token.</summary>
/// <remarks>A replacement gets a new identifier but preserves the original authentication time.
/// LoginFamilyId optionally correlates rotations and workspace switches within one login.
/// This is neither a credential nor proof of current authorization.</remarks>
public sealed record AuthSessionMetadata(Guid SessionId, DateTimeOffset AuthenticatedAtUtc, Guid? LoginFamilyId = null);
