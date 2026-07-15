namespace BrighterTools.Auth.Constants;

/// <summary>
/// Stable error codes surfaced for authentication failures that callers may map to user-friendly UX.
/// </summary>
public static class AuthFailureCodes
{
    public const string ExternalProviderMisconfigured = "external_provider_misconfigured";
    public const string ExternalProviderCredentialInvalid = "external_provider_credential_invalid";
    public const string ExternalLoginNotLinked = "external_login_not_linked";
    public const string ExternalLoginAlreadyLinked = "external_login_already_linked";
    public const string ExternalEmailVerificationRequired = "external_email_verification_required";
    public const string ExternalProviderNotSupported = "external_provider_not_supported";
    public const string ExternalProviderNotEnabledForAccount = "external_provider_not_enabled_for_account";
}