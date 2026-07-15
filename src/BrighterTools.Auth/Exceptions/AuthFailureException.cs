namespace BrighterTools.Auth.Exceptions;

/// <summary>
/// Represents an authentication failure with a stable code that host applications can map to UX.
/// </summary>
public sealed class AuthFailureException : InvalidOperationException
{
    public AuthFailureException(string code, string message, Exception? innerException = null)
        : base(message, innerException)
    {
        Code = code;
    }

    /// <summary>
    /// Gets the stable failure code for the authentication error.
    /// </summary>
    public string Code { get; }
}