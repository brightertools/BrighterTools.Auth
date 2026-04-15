using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents the response payload for linked Providers.
/// </summary>
public sealed class LinkedProvidersResponse
{
    /// <summary>
    /// Gets or sets the collection of providers.
    /// </summary>
    public IReadOnlyList<ExternalLogin> Providers { get; init; } = [];
}

