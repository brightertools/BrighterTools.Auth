namespace BrighterTools.Auth.Abstractions;

/// <summary>Host unit of work covering session issuance, rotation and tenant selection.</summary>
/// <remarks>Nested calls must join the existing transaction. Commit only after the operation
/// succeeds; rollback on every exception. Do not retry the operation after an ambiguous commit.</remarks>
public interface IAuthSessionTransaction
{
    /// <summary>Executes a session transition atomically using the host's scoped persistence context.</summary>
    Task<T> ExecuteAsync<T>(Func<CancellationToken, Task<T>> operation, CancellationToken cancellationToken = default);
}
