namespace BrighterTools.Auth.Abstractions;

/// <summary>Host-selected profile for freshly authenticated sessions. Never read from refresh request fields.</summary>
public interface IAuthSessionProfileContext
{
    string? FreshSessionProfile { get; }
}
