export type ExternalAuthProviderType = "Google" | "Apple" | "Microsoft";
export type GoogleButtonText = "signin_with" | "signup_with" | "continue_with" | "signin";
export type LoginEmailPlacement = "first" | "last";
export type LoginEmailDisplayMode = "button" | "inline";

export interface AuthProviderUiConfig {
  provider: ExternalAuthProviderType;
  enabled?: boolean;
  buttonOrder?: number;
  label?: string;
  busyLabel?: string;
  googleText?: GoogleButtonText;
}

export interface LoginEmailUiOptions {
  emailPlacement?: LoginEmailPlacement;
  emailDisplayMode?: LoginEmailDisplayMode;
  separatorText?: string;
}

export interface SharedAuthTextOverrides {
  providerLabels?: Record<string, string>;
}

export interface EmailVerificationFieldTextOverrides {
  emailPlaceholder?: string;
  codePlaceholder?: string;
  sendLabel?: string;
  sendingLabel?: string;
  verifyLabel?: string;
  verifyingLabel?: string;
  verifiedLabel?: string;
  changeEmailAddressLabel?: string;
  changeEmailLabel?: string;
  resendCodeLabel?: string;
}

export interface PasswordLoginFormTextOverrides {
  loginLabel?: string;
  passwordLabel?: string;
  submitLabel?: string;
  submittingLabel?: string;
}

export interface PasswordlessEmailLoginFormTextOverrides {
  emailLabel?: string;
  codeLabel?: string;
  requestLabel?: string;
  requestBusyLabel?: string;
  completeLabel?: string;
}

export interface LoginPanelTextOverrides {
  checkingSecureSignInLinkMessage?: string;
  invalidSecureSignInLinkMessage?: string;
  emptyUsernameOrEmailMessage?: string;
  emptyEmailMessage?: string;
  invalidEmailMessage?: string;
  passwordRequiredMessage?: string;
  emailButtonLabel?: string;
  continueWithAppleLabel?: string;
  openingAppleLabel?: string;
  continueWithMicrosoftLabel?: string;
  openingMicrosoftLabel?: string;
  signInLabel?: string;
  signingInLabel?: string;
  passwordLabel?: string;
  emailLabel?: string;
  usernameOrEmailLabel?: string;
  backToLoginOptionsLabel?: string;
  backToPasswordLoginLabel?: string;
  passwordlessModeLabel?: string;
  passwordlessHeading?: string;
  passwordlessDescription?: string;
  passwordlessRequestPromptMessage?: string;
  passwordlessRequestFailedMessage?: string;
  passwordlessRequestSuccessMessage?: string;
  passwordlessCodeInvalidMessage?: string;
  providerLoginFailedMessage?: string;
}

export interface SignupPanelTextOverrides {
  dateOfBirthLabel?: string;
  invalidDateOfBirthMessage?: string;
  missingDateOfBirthMessage?: string;
  minimumAgeMessage?: string;
  minimumAgeConfirmationMessage?: string;
  minimumAgeCheckboxLabel?: string;
  legalConsentRequiredMessage?: string;
  emailVerificationRequestFailedMessage?: string;
  emailVerificationRequestedMessage?: string;
  emailVerificationRequestPromptMessage?: string;
  emailVerificationCodePromptMessage?: string;
  emailVerificationFailedMessage?: string;
  emailVerifiedMessage?: string;
  passwordRequirementsMessage?: string;
  verifyEmailBeforeSignupMessage?: string;
  registrationFailedMessage?: string;
  registrationCreatedVerifyEmailMessage?: string;
  genericSignupErrorMessage?: string;
  providerSignupFailedMessage?: string;
  appleSignupCancelledMessage?: string;
  microsoftSignupCancelledMessage?: string;
  microsoftEmailRequiredTitle?: string;
  microsoftEmailRequiredDescription?: string;
  microsoftEmailRequiredSuccessMessage?: string;
  cancelLabel?: string;
  emailAddressLabel?: string;
  createAccountWithMicrosoftLabel?: string;
  creatingAccountWithMicrosoftLabel?: string;
  createAccountLabel?: string;
  creatingAccountLabel?: string;
  signUpWithAppleLabel?: string;
  openingAppleLabel?: string;
  signUpWithMicrosoftLabel?: string;
  openingMicrosoftLabel?: string;
  signUpWithEmailLabel?: string;
  backToSignupOptionsLabel?: string;
  passwordLabel?: string;
  confirmPasswordLabel?: string;
}

export interface AccountLoginMethodsTextOverrides {
  loadErrorMessage?: string;
  loadingMessage?: string;
  retryLabel?: string;
  providerConnectedMessage?: string;
  providerConnectFailedMessage?: string;
  providerRemovedMessage?: string;
  providerRemoveFailedMessage?: string;
  providerConnectCancelledMessage?: string;
  emailVerificationStartFailedMessage?: string;
  emailVerificationSentMessage?: string;
  notificationEmailVerificationStartFailedMessage?: string;
  notificationEmailVerificationSentMessage?: string;
  verifyCodeFirstMessage?: string;
  verifyNotificationCodeFirstMessage?: string;
  verifyCodeFailedMessage?: string;
  loginEmailVerifiedMessage?: string;
  notificationEmailVerifiedMessage?: string;
  passwordSetupEmailFailedMessage?: string;
  passwordSetupEmailSentMessage?: string;
  changePasswordFailedMessage?: string;
  changePasswordSuccessMessage?: string;
  removePasswordFailedMessage?: string;
  removePasswordSuccessMessage?: string;
  completePasswordSetupFailedMessage?: string;
  completePasswordSetupSuccessMessage?: string;
  addAnotherLoginMethodMessage?: string;
  addProviderBeforePasswordRemovalMessage?: string;
  invalidEmailMessage?: string;
  verifyEmailBeforeSavingPasswordMessage?: string;
  passwordRequirementsBeforeSavingMessage?: string;
  passwordRequirementsBeforeChangingMessage?: string;
  notificationEmailRequiredTitle?: string;
  notificationEmailRequiredDescription?: string;
  notificationEmailValueLabel?: string;
  notificationEmailHeading?: string;
  notificationEmailDescription?: string;
  verifiedBadgeLabel?: string;
  needsVerificationBadgeLabel?: string;
  suggestedVerifiedEmailsLabel?: string;
  notificationEmailAddressLabel?: string;
  enterCodeSentMessage?: string;
  setupPasswordHeading?: string;
  setupPasswordDescription?: string;
  suggestedAccountEmailMessage?: string;
  notSetUpBadgeLabel?: string;
  pendingEmailVerificationLabel?: string;
  legacyUsernameLabel?: string;
  emailAddressLabel?: string;
  useVerifiedEmailLabel?: string;
  passwordLabel?: string;
  confirmPasswordLabel?: string;
  saveEmailPasswordLoginLabel?: string;
  savingLabel?: string;
  loginEmailHeading?: string;
  loginEmailDescription?: string;
  privateRelayBadgeLabel?: string;
  passwordHeading?: string;
  passwordDescription?: string;
  enabledBadgeLabel?: string;
  changePasswordLabel?: string;
  currentPasswordLabel?: string;
  newPasswordLabel?: string;
  confirmNewPasswordLabel?: string;
  updatePasswordLabel?: string;
  updatingLabel?: string;
  cancelLabel?: string;
  removePasswordHeading?: string;
  removePasswordDescription?: string;
  connectProviderBeforeRemovingPasswordMessage?: string;
  removePasswordLoginLabel?: string;
  removingLabel?: string;
  connectedProvidersHeading?: string;
  noConnectedProvidersMessage?: string;
  verifiedByProviderMessage?: string;
  removeLabel?: string;
  providerConnectedDescription?: string;
  providerConnectDescription?: string;
  connectAppleLabel?: string;
  openingAppleLabel?: string;
  connectMicrosoftLabel?: string;
  openingMicrosoftLabel?: string;
  removePasswordModalTitle?: string;
  removePasswordModalWarning?: string;
  removePasswordModalBody?: string;
  removePasswordModalFooter?: string;
  removeEmailLoginLabel?: string;
}

export interface InvitationAcceptanceTextOverrides {
  title?: string;
  declineTitle?: string;
  loadingInvitationMessage?: string;
  invitationKeyMissingMessage?: string;
  invalidInvitationMessage?: string;
  invitationStatusMessage?: string;
  invitationLoadFailedMessage?: string;
  invitedToJoinMessage?: string;
  invitationSentByMessage?: string;
  declineInvitationHintMessage?: string;
  declineLinkLabel?: string;
  useCurrentAccountHeading?: string;
  loggedInAsMessage?: string;
  alreadyBelongsMessage?: string;
  useCurrentAccountDescription?: string;
  useCurrentAccountLabel?: string;
  usingCurrentAccountLabel?: string;
  useAnotherAccountLabel?: string;
  switchingAccountLabel?: string;
  existingAccountHeading?: string;
  existingAccountEmailLabel?: string;
  existingAccountPasswordLabel?: string;
  connectExistingAccountLabel?: string;
  connectingExistingAccountLabel?: string;
  createNewAccountInsteadLabel?: string;
  createAccountHeading?: string;
  firstNameLabel?: string;
  lastNameLabel?: string;
  emailAddressLabel?: string;
  passwordLabel?: string;
  confirmPasswordLabel?: string;
  firstNameRequiredMessage?: string;
  lastNameRequiredMessage?: string;
  emailRequiredMessage?: string;
  invalidEmailMessage?: string;
  passwordRequiredMessage?: string;
  confirmPasswordRequiredMessage?: string;
  passwordMismatchMessage?: string;
  legalConsentRequiredMessage?: string;
  termsAcceptedLabel?: string;
  termsLinkLabel?: string;
  privacyPolicyAcceptedLabel?: string;
  privacyPolicyLinkLabel?: string;
  acceptInvitationLabel?: string;
  acceptingInvitationLabel?: string;
  alreadyHaveAccountLabel?: string;
  acceptFailedMessage?: string;
  loginFailedMessage?: string;
  connectFailedMessage?: string;
  invitationAcceptedMessage?: string;
  invitationAcceptedVerifyEmailMessage?: string;
  declineConfirmationBody?: string;
  declineMessageLabel?: string;
  declineInvitationLabel?: string;
  decliningInvitationLabel?: string;
  cancelLabel?: string;
  invitationDeclinedMessage?: string;
  declineFailedMessage?: string;
}

export interface InvitationManagementTextOverrides {
  title?: string;
  listTabLabel?: string;
  inviteTabLabel?: string;
  importTabLabel?: string;
  searchPlaceholder?: string;
  searchLabel?: string;
  clearLabel?: string;
  loadingMessage?: string;
  loadFailedMessage?: string;
  noInvitationsMessage?: string;
  nameColumnLabel?: string;
  emailColumnLabel?: string;
  roleColumnLabel?: string;
  statusColumnLabel?: string;
  invitationDateColumnLabel?: string;
  expiryDateColumnLabel?: string;
  actionsColumnLabel?: string;
  pendingStatusLabel?: string;
  acceptedStatusLabel?: string;
  declinedStatusLabel?: string;
  expiredStatusLabel?: string;
  unknownStatusLabel?: string;
  copyLinkLabel?: string;
  copiedLinkMessage?: string;
  copyLinkFailedMessage?: string;
  noInvitationLinkMessage?: string;
  resendLabel?: string;
  resendingLabel?: string;
  resendSuccessMessage?: string;
  resendFailedMessage?: string;
  cancelInvitationLabel?: string;
  cancellingInvitationLabel?: string;
  cancelSuccessMessage?: string;
  cancelFailedMessage?: string;
  removeInvitationLabel?: string;
  removingInvitationLabel?: string;
  removeSuccessMessage?: string;
  removeFailedMessage?: string;
  detailsLabel?: string;
  hideDetailsLabel?: string;
  detailsLoadingMessage?: string;
  detailsLoadFailedMessage?: string;
  inviteHeading?: string;
  firstNameLabel?: string;
  lastNameLabel?: string;
  emailAddressLabel?: string;
  roleLabel?: string;
  optionalMessageLabel?: string;
  canChangeEmailAddressLabel?: string;
  canChangeEmailAddressDescription?: string;
  sendInvitationLabel?: string;
  sendingInvitationLabel?: string;
  inviteSuccessMessage?: string;
  inviteFailedMessage?: string;
  cancelLabel?: string;
  pageSummaryLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
  detailsGuidLabel?: string;
  detailsInvitationKeyLabel?: string;
  detailsCanChangeEmailLabel?: string;
  detailsAcceptedEmailLabel?: string;
  detailsCreatedLabel?: string;
  detailsUpdatedLabel?: string;
  detailsMessageLabel?: string;
  detailsResponseMessageLabel?: string;
  detailsInviteUrlLabel?: string;
  detailsVerifiedByLabel?: string;
  yesLabel?: string;
  noLabel?: string;
}

export interface InvitationImportTextOverrides {
  title?: string;
  instructionsMessage?: string;
  sharedMessageLabel?: string;
  chooseFileLabel?: string;
  noFileChosenMessage?: string;
  invalidRowsHeading?: string;
  previewRowsHeading?: string;
  rowColumnLabel?: string;
  errorColumnLabel?: string;
  importAndSendLabel?: string;
  importingLabel?: string;
  chooseFileFirstMessage?: string;
  importFailedMessage?: string;
  importSuccessMessage?: string;
  importValidationWarningMessage?: string;
}

export interface AuthUiTextOverrides {
  shared?: SharedAuthTextOverrides;
  login?: LoginPanelTextOverrides;
  signup?: SignupPanelTextOverrides;
  passwordLogin?: PasswordLoginFormTextOverrides;
  passwordlessEmailLogin?: PasswordlessEmailLoginFormTextOverrides;
  emailVerificationField?: EmailVerificationFieldTextOverrides;
  accountLoginMethods?: AccountLoginMethodsTextOverrides;
  invitationAcceptance?: InvitationAcceptanceTextOverrides;
  invitationManagement?: InvitationManagementTextOverrides;
  invitationImport?: InvitationImportTextOverrides;
}

export interface ResolvedAuthProviderUiConfig extends AuthProviderUiConfig {
  orderIndex: number;
}

export type AuthUiTranslate = (key: string, fallback?: string) => string;

export interface LocalizationManifestEntry {
  key: string;
  defaultValue: string;
}

export const defaultLoginEmailUiOptions: Required<LoginEmailUiOptions> = {
  emailPlacement: "last",
  emailDisplayMode: "button",
  separatorText: "-- or --"
};

export const defaultPasswordLoginFormText: Required<PasswordLoginFormTextOverrides> = {
  loginLabel: "Email",
  passwordLabel: "Password",
  submitLabel: "Sign in",
  submittingLabel: "Signing in..."
};

export const defaultPasswordlessEmailLoginFormText: Required<PasswordlessEmailLoginFormTextOverrides> = {
  emailLabel: "Email",
  codeLabel: "Code",
  requestLabel: "Email me a sign-in code",
  requestBusyLabel: "Sending...",
  completeLabel: "Sign in"
};

export const defaultEmailVerificationFieldText: Required<EmailVerificationFieldTextOverrides> = {
  emailPlaceholder: "Enter your email address",
  codePlaceholder: "Enter verification code",
  sendLabel: "Verify email",
  sendingLabel: "Sending...",
  verifyLabel: "Verify code",
  verifyingLabel: "Verifying...",
  verifiedLabel: "Verified",
  changeEmailAddressLabel: "change email address",
  changeEmailLabel: "change email",
  resendCodeLabel: "Resend code"
};

export const defaultLoginPanelText: Required<LoginPanelTextOverrides> = {
  checkingSecureSignInLinkMessage: "Checking your secure sign-in link...",
  invalidSecureSignInLinkMessage: "This sign-in link is invalid or has expired.",
  emptyUsernameOrEmailMessage: "Enter your username or email address.",
  emptyEmailMessage: "Enter your email address.",
  invalidEmailMessage: "Enter a valid email address.",
  passwordRequiredMessage: "Password is required.",
  emailButtonLabel: "Continue with Email",
  continueWithAppleLabel: "Continue with Apple",
  openingAppleLabel: "Opening Apple...",
  continueWithMicrosoftLabel: "Continue with Microsoft",
  openingMicrosoftLabel: "Opening Microsoft...",
  signInLabel: "Sign in",
  signingInLabel: "Signing in...",
  passwordLabel: "Password",
  emailLabel: "Email",
  usernameOrEmailLabel: "Username / Email",
  backToLoginOptionsLabel: "Back to login options",
  backToPasswordLoginLabel: "Back to Login",
  passwordlessModeLabel: "Send a one-time login code via email",
  passwordlessHeading: "Send a one-time login code via email",
  passwordlessDescription: "Useful on mobile, or if you do not want to use your password right now.",
  passwordlessRequestPromptMessage: "Please request a sign-in code first.",
  passwordlessRequestFailedMessage: "Could not send a sign-in code.",
  passwordlessRequestSuccessMessage: "If this email is verified, we sent a secure sign-in code.",
  passwordlessCodeInvalidMessage: "This sign-in code is invalid or has expired.",
  providerLoginFailedMessage: "{provider} login failed. Please try again."
};

export const defaultSignupPanelText: Required<SignupPanelTextOverrides> = {
  dateOfBirthLabel: "Date of birth",
  invalidDateOfBirthMessage: "Please enter a valid date of birth.",
  missingDateOfBirthMessage: "Please enter your date of birth.",
  minimumAgeMessage: "You must be at least {minimumAge} years old.",
  minimumAgeConfirmationMessage: "Please confirm you are at least {minimumAge} years old.",
  minimumAgeCheckboxLabel: "I confirm I am at least {minimumAge} years old.",
  legalConsentRequiredMessage: "Please accept the terms and privacy policy before creating an account.",
  emailVerificationRequestFailedMessage: "Could not send a verification code.",
  emailVerificationRequestedMessage: "A verification code has been sent to your email address.",
  emailVerificationRequestPromptMessage: "Please request a verification code first.",
  emailVerificationCodePromptMessage: "Enter the code we sent to this email address.",
  emailVerificationFailedMessage: "Could not verify this code.",
  emailVerifiedMessage: "Email verified. You can now create your account.",
  passwordRequirementsMessage: "Please complete the password requirements before creating your account.",
  verifyEmailBeforeSignupMessage: "Please verify your email address before creating your account.",
  registrationFailedMessage: "Registration failed.",
  registrationCreatedVerifyEmailMessage: "Your account has been created. Please verify your email address before signing in.",
  genericSignupErrorMessage: "Something went wrong. Please try again.",
  providerSignupFailedMessage: "{provider} signup failed. Please try again.",
  appleSignupCancelledMessage: "Apple sign-up was cancelled or failed.",
  microsoftSignupCancelledMessage: "Microsoft sign-up was cancelled or failed.",
  microsoftEmailRequiredTitle: "Verify your email to finish Microsoft signup",
  microsoftEmailRequiredDescription: "We need a verified addressable email for your local account and important notifications.",
  microsoftEmailRequiredSuccessMessage: "Microsoft did not provide a usable email address. Verify one to finish creating your account.",
  cancelLabel: "Cancel",
  emailAddressLabel: "Email address",
  createAccountWithMicrosoftLabel: "Create account with Microsoft",
  creatingAccountWithMicrosoftLabel: "Creating account...",
  createAccountLabel: "Create account",
  creatingAccountLabel: "Creating account...",
  signUpWithAppleLabel: "Sign up with Apple",
  openingAppleLabel: "Opening Apple...",
  signUpWithMicrosoftLabel: "Sign up with Microsoft",
  openingMicrosoftLabel: "Opening Microsoft...",
  signUpWithEmailLabel: "Sign up with Email",
  backToSignupOptionsLabel: "Back to signup options",
  passwordLabel: "Password",
  confirmPasswordLabel: "Confirm password"
};

export const defaultAccountLoginMethodsText: Required<AccountLoginMethodsTextOverrides> = {
  loadErrorMessage: "Could not load login methods.",
  loadingMessage: "Loading your login methods...",
  retryLabel: "Try again",
  providerConnectedMessage: "{provider} has been connected.",
  providerConnectFailedMessage: "Could not connect {provider}.",
  providerRemovedMessage: "{provider} has been removed.",
  providerRemoveFailedMessage: "Could not remove {provider}.",
  providerConnectCancelledMessage: "{provider} sign-in was cancelled or failed.",
  emailVerificationStartFailedMessage: "Could not start email verification.",
  emailVerificationSentMessage: "We sent a verification code and link to that email.",
  notificationEmailVerificationStartFailedMessage: "Could not start notification email verification.",
  notificationEmailVerificationSentMessage: "We sent a verification code and link to that email.",
  verifyCodeFirstMessage: "Please request a verification code first.",
  verifyNotificationCodeFirstMessage: "Please request a notification email verification code first.",
  verifyCodeFailedMessage: "Could not verify this code.",
  loginEmailVerifiedMessage: "Your login email has been verified.",
  notificationEmailVerifiedMessage: "Your notification email has been verified.",
  passwordSetupEmailFailedMessage: "Could not send password setup email.",
  passwordSetupEmailSentMessage: "We sent a secure password setup link to your login email.",
  changePasswordFailedMessage: "Could not update your password.",
  changePasswordSuccessMessage: "Your password has been updated.",
  removePasswordFailedMessage: "Could not remove email/password login.",
  removePasswordSuccessMessage: "Email/password login has been removed.",
  completePasswordSetupFailedMessage: "Could not set up email/password login.",
  completePasswordSetupSuccessMessage: "Email/password login has been set up.",
  addAnotherLoginMethodMessage: "Add a password or another sign-in provider before removing your last login method.",
  addProviderBeforePasswordRemovalMessage: "Add Google, Apple, Microsoft, or another sign-in provider before removing email/password login.",
  invalidEmailMessage: "Please enter a valid email address.",
  verifyEmailBeforeSavingPasswordMessage: "Please verify this email before saving a password.",
  passwordRequirementsBeforeSavingMessage: "Please complete the password requirements before saving.",
  passwordRequirementsBeforeChangingMessage: "Please enter your current password and complete the new password requirements.",
  notificationEmailRequiredTitle: "Notification email required.",
  notificationEmailRequiredDescription: "Please verify an addressable email so important account notifications can reach you.",
  notificationEmailValueLabel: "Notification email:",
  notificationEmailHeading: "Notification email",
  notificationEmailDescription: "Used for important account notifications. It can be different from your sign-in provider email.",
  verifiedBadgeLabel: "Verified",
  needsVerificationBadgeLabel: "Needs verification",
  suggestedVerifiedEmailsLabel: "Suggested verified emails",
  notificationEmailAddressLabel: "Notification email address",
  enterCodeSentMessage: "Enter the code we sent to this email address.",
  setupPasswordHeading: "Set up email/password login",
  setupPasswordDescription: "Verify the email you want to use for password login, then choose a password.",
  suggestedAccountEmailMessage: "Suggested from your account: {email}",
  notSetUpBadgeLabel: "Not set up",
  pendingEmailVerificationLabel: "Pending email verification: {email}",
  legacyUsernameLabel: "Legacy Username",
  emailAddressLabel: "Email address",
  useVerifiedEmailLabel: "use {email}",
  passwordLabel: "Password",
  confirmPasswordLabel: "Confirm password",
  saveEmailPasswordLoginLabel: "Save email/password login",
  savingLabel: "Saving...",
  loginEmailHeading: "Login email",
  loginEmailDescription: "Used for email/password login, password reset, and passwordless sign-in codes.",
  privateRelayBadgeLabel: "Private relay",
  passwordHeading: "Password",
  passwordDescription: "Change your email/password login password.",
  enabledBadgeLabel: "Enabled",
  changePasswordLabel: "Change password",
  currentPasswordLabel: "Current password",
  newPasswordLabel: "New password",
  confirmNewPasswordLabel: "Confirm new password",
  updatePasswordLabel: "Update password",
  updatingLabel: "Updating...",
  cancelLabel: "Cancel",
  removePasswordHeading: "Remove email/password login",
  removePasswordDescription: "Your verified email remains on your account, but you will no longer be able to sign in with a password.",
  connectProviderBeforeRemovingPasswordMessage: "Connect Google, Apple, or Microsoft before removing your password login.",
  removePasswordLoginLabel: "Remove email/password login",
  removingLabel: "Removing...",
  connectedProvidersHeading: "Connected providers",
  noConnectedProvidersMessage: "No external providers are connected yet.",
  verifiedByProviderMessage: "Verified by {provider}",
  removeLabel: "Remove",
  providerConnectedDescription: "{provider} is connected.",
  providerConnectDescription: "Connect your {provider} account for quick sign-in.",
  connectAppleLabel: "Connect Apple",
  openingAppleLabel: "Opening Apple...",
  connectMicrosoftLabel: "Connect Microsoft",
  openingMicrosoftLabel: "Opening Microsoft...",
  removePasswordModalTitle: "Remove email login?",
  removePasswordModalWarning: "This removes email/password login from your account.",
  removePasswordModalBody: "Your current session will stay active, but next time you will need to sign in with another connected provider.",
  removePasswordModalFooter: "Your verified email address will remain on your account for notifications, passwordless email sign-in, and account records.",
  removeEmailLoginLabel: "Remove email login"
};

export const defaultInvitationAcceptanceText: Required<InvitationAcceptanceTextOverrides> = {
  title: "User Invitation",
  declineTitle: "Decline User Invitation",
  loadingInvitationMessage: "Loading user invitation...",
  invitationKeyMissingMessage: "Invitation key is missing.",
  invalidInvitationMessage: "Invitation is invalid or has expired.",
  invitationStatusMessage: "This invitation has already been {status}.",
  invitationLoadFailedMessage: "Unable to load the invitation details. Please try again.",
  invitedToJoinMessage: "You have been invited to join {accountName}.",
  invitationSentByMessage: "The invitation was sent by {invitedBy}.",
  declineInvitationHintMessage: "If you do not wish to join, you can decline the invitation.",
  declineLinkLabel: "decline the invitation",
  useCurrentAccountHeading: "Use Current Account",
  loggedInAsMessage: "Logged in as {name} ({email})",
  alreadyBelongsMessage: "You already belong to this organisation/group with this account, so this invitation cannot be accepted again.",
  useCurrentAccountDescription: "You are already logged in. Do you want to use this account?",
  useCurrentAccountLabel: "Use this account to accept invitation",
  usingCurrentAccountLabel: "Accepting Invitation",
  useAnotherAccountLabel: "Accept using another account",
  switchingAccountLabel: "Switching account...",
  existingAccountHeading: "Login To Existing Account",
  existingAccountEmailLabel: "Email address",
  existingAccountPasswordLabel: "Password",
  connectExistingAccountLabel: "Login & Connect Existing Account",
  connectingExistingAccountLabel: "Connecting Account",
  createNewAccountInsteadLabel: "Create new account and accept invitation",
  createAccountHeading: "Create New Account And Accept Invitation",
  firstNameLabel: "First Name",
  lastNameLabel: "Last Name",
  emailAddressLabel: "Email address",
  passwordLabel: "Password",
  confirmPasswordLabel: "Confirm Password",
  firstNameRequiredMessage: "Please enter your first name.",
  lastNameRequiredMessage: "Please enter your last name.",
  emailRequiredMessage: "Please enter your email address.",
  invalidEmailMessage: "Please enter a valid email address.",
  passwordRequiredMessage: "Please enter a password.",
  confirmPasswordRequiredMessage: "Please confirm your password.",
  passwordMismatchMessage: "Passwords must match.",
  legalConsentRequiredMessage: "Please accept the terms and privacy policy before accepting the invitation.",
  termsAcceptedLabel: "I have read and accept the",
  termsLinkLabel: "Terms of Service",
  privacyPolicyAcceptedLabel: "I accept the",
  privacyPolicyLinkLabel: "Privacy Policy",
  acceptInvitationLabel: "Accept Invitation",
  acceptingInvitationLabel: "Accepting Invitation",
  alreadyHaveAccountLabel: "I already have an account",
  acceptFailedMessage: "Error accepting invitation.",
  loginFailedMessage: "Login failed.",
  connectFailedMessage: "Could not connect this invitation.",
  invitationAcceptedMessage: "You have successfully accepted the invitation.",
  invitationAcceptedVerifyEmailMessage: "Your account has been created. Please verify your email address before signing in.",
  declineConfirmationBody: "If you decline this invitation, the inviter may be notified. You can include an optional message below.",
  declineMessageLabel: "Response Reason/Message (optional)",
  declineInvitationLabel: "Decline Invitation",
  decliningInvitationLabel: "Declining Invitation",
  cancelLabel: "Cancel",
  invitationDeclinedMessage: "You have successfully declined the invitation.",
  declineFailedMessage: "Error declining invitation."
};

export const defaultInvitationManagementText: Required<InvitationManagementTextOverrides> = {
  title: "User Invitations",
  listTabLabel: "List",
  inviteTabLabel: "Invite User",
  importTabLabel: "Import",
  searchPlaceholder: "Search invitations by name/email",
  searchLabel: "Search",
  clearLabel: "Clear",
  loadingMessage: "Loading...",
  loadFailedMessage: "Failed to load invitations.",
  noInvitationsMessage: "No invitations found.",
  nameColumnLabel: "Name",
  emailColumnLabel: "Email",
  roleColumnLabel: "Role",
  statusColumnLabel: "Status",
  invitationDateColumnLabel: "Invitation Date",
  expiryDateColumnLabel: "Expiry Date",
  actionsColumnLabel: "Actions",
  pendingStatusLabel: "Pending",
  acceptedStatusLabel: "Accepted",
  declinedStatusLabel: "Declined",
  expiredStatusLabel: "Expired",
  unknownStatusLabel: "Unknown",
  copyLinkLabel: "Copy Link",
  copiedLinkMessage: "Invite link copied to clipboard.",
  copyLinkFailedMessage: "Unable to copy invite link from browser clipboard API.",
  noInvitationLinkMessage: "No invitation key available to copy.",
  resendLabel: "Resend",
  resendingLabel: "Working...",
  resendSuccessMessage: "Invitation resent.",
  resendFailedMessage: "Failed to resend invitation.",
  cancelInvitationLabel: "Cancel",
  cancellingInvitationLabel: "Working...",
  cancelSuccessMessage: "Invitation cancelled.",
  cancelFailedMessage: "Failed to cancel invitation.",
  removeInvitationLabel: "Remove",
  removingInvitationLabel: "Working...",
  removeSuccessMessage: "Invitation removed.",
  removeFailedMessage: "Failed to remove invitation.",
  detailsLabel: "Details",
  hideDetailsLabel: "Hide",
  detailsLoadingMessage: "Loading details...",
  detailsLoadFailedMessage: "Unable to load invitation details.",
  inviteHeading: "Invite User",
  firstNameLabel: "First Name",
  lastNameLabel: "Last Name",
  emailAddressLabel: "Email",
  roleLabel: "Role",
  optionalMessageLabel: "Optional Message",
  canChangeEmailAddressLabel: "User can use any email address?",
  canChangeEmailAddressDescription: "Allows the use of any email address when accepting the invitation.",
  sendInvitationLabel: "Send Invitation",
  sendingInvitationLabel: "Sending Invitation",
  inviteSuccessMessage: "Invitation sent.",
  inviteFailedMessage: "Failed to send invitation.",
  cancelLabel: "Cancel",
  pageSummaryLabel: "Showing page {page} of {totalPages} ({totalCount} total)",
  previousLabel: "Previous",
  nextLabel: "Next",
  detailsGuidLabel: "Guid",
  detailsInvitationKeyLabel: "Invitation Key",
  detailsCanChangeEmailLabel: "Can Change Email",
  detailsAcceptedEmailLabel: "Accepted Email",
  detailsCreatedLabel: "Created",
  detailsUpdatedLabel: "Updated",
  detailsMessageLabel: "Message",
  detailsResponseMessageLabel: "Response Message",
  detailsInviteUrlLabel: "Invite URL",
  detailsVerifiedByLabel: "Verified by {provider}",
  yesLabel: "Yes",
  noLabel: "No"
};

export const defaultInvitationImportText: Required<InvitationImportTextOverrides> = {
  title: "Import Users",
  instructionsMessage: "Required columns: First Name, LastName, EmailAddress, UserRole, Allow Any Email.",
  sharedMessageLabel: "Message to all invited users (optional)",
  chooseFileLabel: "Choose File",
  noFileChosenMessage: "No file chosen",
  invalidRowsHeading: "Invalid rows ({count})",
  previewRowsHeading: "Preview rows ({count} shown)",
  rowColumnLabel: "Row",
  errorColumnLabel: "Error",
  importAndSendLabel: "Import and Send",
  importingLabel: "Importing...",
  chooseFileFirstMessage: "Please choose a file first.",
  importFailedMessage: "Import failed.",
  importSuccessMessage: "{count} invitation(s) queued/sent successfully.",
  importValidationWarningMessage: "{count} invalid row(s) found. Fix the file and try again."
};

export const defaultAuthProviderLabels: Record<string, string> = {
  Password: "Email / Password",
  EmailOtp: "Email code",
  Passkey: "Passkey",
  Google: "Google",
  Apple: "Apple",
  Microsoft: "Microsoft",
  "0": "Unknown",
  "1": "Email / Password",
  "2": "Google",
  "3": "Apple",
  "4": "Microsoft"
};

export const defaultAuthUiText = {
  shared: {
    providerLabels: defaultAuthProviderLabels
  },
  login: defaultLoginPanelText,
  signup: defaultSignupPanelText,
  passwordLogin: defaultPasswordLoginFormText,
  passwordlessEmailLogin: defaultPasswordlessEmailLoginFormText,
  emailVerificationField: defaultEmailVerificationFieldText,
  accountLoginMethods: defaultAccountLoginMethodsText,
  invitationAcceptance: defaultInvitationAcceptanceText,
  invitationManagement: defaultInvitationManagementText,
  invitationImport: defaultInvitationImportText
};

const defaultExternalAuthProviderOrder: ExternalAuthProviderType[] = ["Google", "Apple", "Microsoft"];

const flattenLocalizationManifestEntries = (prefix: string, source: Record<string, unknown>): LocalizationManifestEntry[] => {
  return Object.entries(source).flatMap(([key, value]) => {
    const nextKey = `${prefix}.${key}`;

    if (typeof value === "string") {
      return [{ key: nextKey, defaultValue: value }];
    }

    return flattenLocalizationManifestEntries(nextKey, value as Record<string, unknown>);
  });
};

export function createAuthLocalizationManifest(namespaceName?: string): LocalizationManifestEntry[] {
  const prefix = namespaceName ? `${namespaceName}.auth` : "auth";
  return flattenLocalizationManifestEntries(prefix, defaultAuthUiText as Record<string, unknown>);
}

export const authLocalizationManifest = createAuthLocalizationManifest();

function localizeRecord<T extends Record<string, string>>(prefix: string, defaults: T, translate: AuthUiTranslate): T {
  return Object.fromEntries(
    Object.entries(defaults).map(([key, defaultValue]) => [key, translate(`${prefix}.${key}`, defaultValue)])
  ) as T;
}

export function formatAuthText(template: string, values: Record<string, string | number | undefined>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

export function getAuthProviderLabel(provider: string | number | null | undefined, textOverrides?: AuthUiTextOverrides) {
  const normalizedProvider = String(provider ?? "").trim();
  if (!normalizedProvider) {
    return "Unknown";
  }

  return textOverrides?.shared?.providerLabels?.[normalizedProvider]
    ?? defaultAuthProviderLabels[normalizedProvider]
    ?? normalizedProvider;
}

export function mergeAuthUiTextOverrides(base: AuthUiTextOverrides, overrides?: AuthUiTextOverrides): AuthUiTextOverrides {
  if (!overrides) {
    return base;
  }

  return {
    ...base,
    ...overrides,
    shared: {
      ...base.shared,
      ...overrides.shared,
      providerLabels: {
        ...base.shared?.providerLabels,
        ...overrides.shared?.providerLabels
      }
    },
    login: {
      ...base.login,
      ...overrides.login
    },
    signup: {
      ...base.signup,
      ...overrides.signup
    },
    passwordLogin: {
      ...base.passwordLogin,
      ...overrides.passwordLogin
    },
    passwordlessEmailLogin: {
      ...base.passwordlessEmailLogin,
      ...overrides.passwordlessEmailLogin
    },
    emailVerificationField: {
      ...base.emailVerificationField,
      ...overrides.emailVerificationField
    },
    accountLoginMethods: {
      ...base.accountLoginMethods,
      ...overrides.accountLoginMethods
    },
    invitationAcceptance: {
      ...base.invitationAcceptance,
      ...overrides.invitationAcceptance
    },
    invitationManagement: {
      ...base.invitationManagement,
      ...overrides.invitationManagement
    },
    invitationImport: {
      ...base.invitationImport,
      ...overrides.invitationImport
    }
  };
}

export function createLocalizedAuthUiText(translate: AuthUiTranslate, overrides?: AuthUiTextOverrides): AuthUiTextOverrides {
  const localized: AuthUiTextOverrides = {
    shared: {
      providerLabels: localizeRecord("auth.shared.providerLabels", defaultAuthUiText.shared.providerLabels, translate)
    },
    login: localizeRecord("auth.login", defaultAuthUiText.login, translate),
    signup: localizeRecord("auth.signup", defaultAuthUiText.signup, translate),
    passwordLogin: localizeRecord("auth.passwordLogin", defaultAuthUiText.passwordLogin, translate),
    passwordlessEmailLogin: localizeRecord("auth.passwordlessEmailLogin", defaultAuthUiText.passwordlessEmailLogin, translate),
    emailVerificationField: localizeRecord("auth.emailVerificationField", defaultAuthUiText.emailVerificationField, translate),
    accountLoginMethods: localizeRecord("auth.accountLoginMethods", defaultAuthUiText.accountLoginMethods, translate),
    invitationAcceptance: localizeRecord("auth.invitationAcceptance", defaultAuthUiText.invitationAcceptance, translate),
    invitationManagement: localizeRecord("auth.invitationManagement", defaultAuthUiText.invitationManagement, translate),
    invitationImport: localizeRecord("auth.invitationImport", defaultAuthUiText.invitationImport, translate)
  };

  return mergeAuthUiTextOverrides(localized, overrides);
}

export function resolveLoginEmailUiOptions(options?: LoginEmailUiOptions): Required<LoginEmailUiOptions> {
  return {
    emailPlacement: options?.emailPlacement ?? defaultLoginEmailUiOptions.emailPlacement,
    emailDisplayMode: options?.emailDisplayMode ?? defaultLoginEmailUiOptions.emailDisplayMode,
    separatorText: options?.separatorText ?? defaultLoginEmailUiOptions.separatorText
  };
}

export function resolveAuthProviderUiConfigs({
  providerUi,
  googleClientId,
  appleClientId,
  microsoftClientId,
  microsoftAuthority,
  defaultGoogleText = "continue_with"
}: {
  providerUi?: AuthProviderUiConfig[];
  googleClientId?: string;
  appleClientId?: string;
  microsoftClientId?: string;
  microsoftAuthority?: string;
  defaultGoogleText?: GoogleButtonText;
}): ResolvedAuthProviderUiConfig[] {
  const availableProviders: Record<ExternalAuthProviderType, boolean> = {
    Google: !!googleClientId,
    Apple: !!appleClientId,
    Microsoft: !!microsoftClientId && !!microsoftAuthority
  };

  const configuredProviders: ResolvedAuthProviderUiConfig[] = providerUi?.length
    ? providerUi.map((config, index) => ({
      ...config,
      enabled: config.enabled ?? true,
      googleText: config.googleText ?? defaultGoogleText,
      orderIndex: index
    }))
    : [];

  const missingProviders: ResolvedAuthProviderUiConfig[] = defaultExternalAuthProviderOrder
    .filter(provider => !configuredProviders.some(config => config.provider === provider))
    .map((provider, index) => ({
      provider,
      enabled: true,
      googleText: defaultGoogleText,
      orderIndex: configuredProviders.length + index
    }));

  return [...configuredProviders, ...missingProviders]
    .filter(config => config.enabled !== false && availableProviders[config.provider])
    .sort((left, right) => {
      const leftOrder = left.buttonOrder ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = right.buttonOrder ?? Number.MAX_SAFE_INTEGER;
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return left.orderIndex - right.orderIndex;
    });
}


