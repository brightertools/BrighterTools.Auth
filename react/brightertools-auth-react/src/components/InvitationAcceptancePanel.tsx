import { useEffect, useId, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { defaultInvitationAcceptanceText, formatAuthText, type AuthUiTextOverrides } from "../authUi";
import { LoginPanel } from "./LoginPanel";
import { PasswordRulesChecklist, isPasswordValid } from "./PasswordRulesChecklist";
import type {
  InvitationAcceptanceClassNames,
  InvitationCreateAccountExtensionProps,
  InvitationDetails,
  InvitationExistingAccountLoginOptions,
  InvitationOperationResult,
  InvitationServiceAdapter
} from "../types/invitations";

type FeedbackTone = "danger" | "success" | "info" | "warning";
type CompletionMode = "accepted" | "connected";

interface FeedbackState {
  tone: FeedbackTone;
  messages: Array<string | ReactNode>;
}

export interface InvitationAcceptancePanelProps<TUser = unknown> {
  className?: string;
  invitationKey?: string | null;
  adapter: Pick<InvitationServiceAdapter, "getInvitationDetails" | "acceptInvitation" | "connectInvitation" | "declineInvitation">;
  textOverrides?: AuthUiTextOverrides;
  currentUser?: TUser | null;
  getCurrentUserDisplayName?: (user: TUser) => string;
  getCurrentUserEmail?: (user: TUser) => string | undefined;
  getCurrentUserLoginProvider?: (user: TUser) => string | undefined;
  isCurrentUserAlreadyInInvitedTenant?: (user: TUser, details: InvitationDetails) => boolean;
  loginWithPassword?: (login: string, password: string) => Promise<InvitationOperationResult<void>>;
  signOutCurrentUser?: () => Promise<void>;
  existingAccountLogin?: InvitationExistingAccountLoginOptions;
  termsUrl?: string;
  privacyUrl?: string;
  minimumPasswordLength?: number;
  classNames?: InvitationAcceptanceClassNames;
  createAccountExtension?: InvitationCreateAccountExtensionProps;
  onCompleted?: (mode: CompletionMode) => void;
}

const joinResultMessages = (result?: Pick<InvitationOperationResult<unknown>, "messages" | "message"> | null, fallback?: string) => {
  const messages = result?.messages?.filter(Boolean) ?? [];
  if (messages.length > 0) {
    return messages;
  }

  if (result?.message) {
    return [result.message];
  }

  return fallback ? [fallback] : [];
};

const formatInvitedBy = (details: InvitationDetails) => {
  const name = details.invitedByUserFullName?.trim() ?? "";
  const email = details.invitedByUserEmail?.trim() ?? "";
  if (name && email) {
    return `${name} (${email})`;
  }

  return name || email;
};

const sameEmail = (first?: string, second?: string) =>
  !!first?.trim() && !!second?.trim() && first.trim().toLowerCase() === second.trim().toLowerCase();

export function InvitationAcceptancePanel<TUser = unknown>({
  className,
  invitationKey,
  adapter,
  textOverrides,
  currentUser,
  getCurrentUserDisplayName,
  getCurrentUserEmail,
  getCurrentUserLoginProvider,
  isCurrentUserAlreadyInInvitedTenant,
  loginWithPassword,
  signOutCurrentUser,
  existingAccountLogin,
  termsUrl = "/terms",
  privacyUrl = "/privacy",
  minimumPasswordLength = 8,
  classNames,
  createAccountExtension,
  onCompleted
}: InvitationAcceptancePanelProps<TUser>) {
  const text = useMemo(
    () => ({
      ...defaultInvitationAcceptanceText,
      ...textOverrides?.invitationAcceptance
    }),
    [textOverrides]
  );
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAccountChoice, setShowAccountChoice] = useState(true);
  const [showExistingAccountLogin, setShowExistingAccountLogin] = useState(false);
  const [decliningInvitation, setDecliningInvitation] = useState(false);
  const [details, setDetails] = useState<InvitationDetails | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [existingEmail, setExistingEmail] = useState("");
  const [existingPassword, setExistingPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");

  const clearFeedback = () => setFeedback(null);

  useEffect(() => {
    let cancelled = false;

    const loadInvitation = async () => {
      if (!invitationKey) {
        setFeedback({ tone: "danger", messages: [text.invitationKeyMissingMessage] });
        setLoading(false);
        return;
      }

      setLoading(true);
      const response = await adapter.getInvitationDetails(invitationKey);
      if (cancelled) {
        return;
      }

      if (!response.success || !response.data) {
        setFeedback({ tone: "danger", messages: joinResultMessages(response, text.invalidInvitationMessage) });
        setDetails(null);
        setLoading(false);
        return;
      }

      const nextDetails = response.data;
      setDetails(nextDetails);
      setFirstName(nextDetails.firstName ?? "");
      setLastName(nextDetails.lastName ?? "");
      setEmail(nextDetails.email ?? "");
      setExistingEmail(nextDetails.email ?? "");
      setLoading(false);

      if (nextDetails.status !== "pending") {
        setFeedback({
          tone: "info",
          messages: [
            formatAuthText(text.invitationStatusMessage, {
              status: nextDetails.status
            })
          ]
        });
      } else if (nextDetails.isValid === false) {
        setFeedback({ tone: "danger", messages: [text.invalidInvitationMessage] });
      } else {
        setFeedback(null);
      }
    };

    void loadInvitation();
    return () => {
      cancelled = true;
    };
  }, [adapter, invitationKey, text.invalidInvitationMessage, text.invitationKeyMissingMessage, text.invitationStatusMessage]);

  const passwordRulesValid = isPasswordValid(password, confirmPassword, minimumPasswordLength);
  const invitedByText = details ? formatInvitedBy(details) : "";
  const currentUserName = currentUser && getCurrentUserDisplayName ? getCurrentUserDisplayName(currentUser) : "";
  const currentUserEmail = currentUser && getCurrentUserEmail ? getCurrentUserEmail(currentUser) ?? "" : "";
  const currentUserProvider = currentUser && getCurrentUserLoginProvider ? getCurrentUserLoginProvider(currentUser) ?? "" : "";
  const alreadyBelongsToTenant = !!(currentUser && details && isCurrentUserAlreadyInInvitedTenant?.(currentUser, details));
  const currentEmailMatchesInvitation = !!details && sameEmail(currentUserEmail, details.email);
  // An optional email projection may be unavailable. Only block known mismatches;
  // the host still authorizes every connect request against the signed-in user.
  const currentAccountRestrictedByEmail = !!currentUser && !!details && !!currentUserEmail.trim() && !alreadyBelongsToTenant && !details.canChangeEmailAddress && !currentEmailMatchesInvitation;
  const showPendingInvitationActions = !!details && details.status === "pending" && details.isValid !== false;
  const extensionContent =
    typeof createAccountExtension?.content === "function"
      ? createAccountExtension.content({ email, canChangeEmailAddress: details?.canChangeEmailAddress ?? true, clearFeedback })
      : createAccountExtension?.content;
  const declineMessageId = useId();
  const existingEmailId = useId();
  const existingPasswordId = useId();
  const firstNameId = useId();
  const lastNameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

  const setOperationError = (messages: Array<string | ReactNode>) => {
    setFeedback({ tone: "danger", messages });
  };

  const switchToExistingAccountLogin = () => {
    clearFeedback();
    setDecliningInvitation(false);
    setResponseMessage("");
    setShowAccountChoice(false);
    setShowExistingAccountLogin(true);
  };

  const switchToCreateAccount = () => {
    clearFeedback();
    setDecliningInvitation(false);
    setResponseMessage("");
    setShowAccountChoice(false);
    setShowExistingAccountLogin(false);
  };

  const openDeclineInvitation = (message = "") => {
    clearFeedback();
    setShowExistingAccountLogin(false);
    setShowAccountChoice(false);
    setResponseMessage(message);
    setDecliningInvitation(true);
  };

  const validateCreateAccount = () => {
    const validationMessages: string[] = [];

    if (firstName.trim().length === 0) {
      validationMessages.push(text.firstNameRequiredMessage);
    }
    if (lastName.trim().length === 0) {
      validationMessages.push(text.lastNameRequiredMessage);
    }
    if (email.trim().length === 0) {
      validationMessages.push(text.emailRequiredMessage);
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      validationMessages.push(text.invalidEmailMessage);
    }
    if (password.length === 0) {
      validationMessages.push(text.passwordRequiredMessage);
    }
    if (confirmPassword.length === 0) {
      validationMessages.push(text.confirmPasswordRequiredMessage);
    } else if (password !== confirmPassword) {
      validationMessages.push(text.passwordMismatchMessage);
    }
    if (!termsAccepted || !privacyPolicyAccepted) {
      validationMessages.push(text.legalConsentRequiredMessage);
    }

    const extensionMessages = createAccountExtension?.validate?.() ?? [];
    return [...validationMessages, ...extensionMessages];
  };

  const completeWithOptionalLogin = async (emailAddress: string, passwordValue: string) => {
    if (!loginWithPassword) {
      onCompleted?.("accepted");
      return;
    }

    const loginResult = await loginWithPassword(emailAddress, passwordValue);
    if (!loginResult.success) {
      setOperationError(joinResultMessages(loginResult, text.loginFailedMessage));
      return;
    }

    onCompleted?.("accepted");
  };

  const acceptInvitation = async () => {
    if (!details || !invitationKey) {
      setOperationError([text.invalidInvitationMessage]);
      return;
    }

    const validationMessages = validateCreateAccount();
    if (validationMessages.length > 0) {
      setOperationError(validationMessages);
      return;
    }

    if (!passwordRulesValid) {
      setOperationError([text.passwordMismatchMessage]);
      return;
    }

    setIsSubmitting(true);
    clearFeedback();
    try {
      const response = await adapter.acceptInvitation({
        userInvitationKey: invitationKey,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        termsAccepted,
        privacyPolicyAccepted,
        usingEmail: true,
        fields: createAccountExtension?.getFields?.()
      });

      if (!response.success) {
        setOperationError(joinResultMessages(response, text.acceptFailedMessage));
        return;
      }

      if (response.data?.activated) {
        await completeWithOptionalLogin(email.trim(), password);
        return;
      }

      setDetails(null);
      setFeedback({
        tone: "success",
        messages: joinResultMessages(
          response,
          response.data?.requiresEmailVerification ? text.invitationAcceptedVerifyEmailMessage : text.invitationAcceptedMessage
        )
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const connectCurrentAccount = async () => {
    if (!invitationKey) {
      setOperationError([text.invalidInvitationMessage]);
      return;
    }

    setIsSubmitting(true);
    clearFeedback();
    try {
      const response = await adapter.connectInvitation({ userInvitationKey: invitationKey });
      if (!response.success) {
        setOperationError(joinResultMessages(response, text.connectFailedMessage));
        return;
      }

      onCompleted?.("connected");
    } finally {
      setIsSubmitting(false);
    }
  };

  const connectExistingAccount = async () => {
    if (!invitationKey) {
      setOperationError([text.invalidInvitationMessage]);
      return;
    }
    if (!loginWithPassword) {
      setOperationError([text.loginFailedMessage]);
      return;
    }
    if (existingEmail.trim().length === 0) {
      setOperationError([text.emailRequiredMessage]);
      return;
    }
    if (existingPassword.length === 0) {
      setOperationError([text.passwordRequiredMessage]);
      return;
    }

    setIsSubmitting(true);
    clearFeedback();
    try {
      const loginResult = await loginWithPassword(existingEmail.trim(), existingPassword);
      if (!loginResult.success) {
        setOperationError(joinResultMessages(loginResult, text.loginFailedMessage));
        return;
      }

      const response = await adapter.connectInvitation({ userInvitationKey: invitationKey });
      if (!response.success) {
        setOperationError(joinResultMessages(response, text.connectFailedMessage));
        return;
      }

      onCompleted?.("connected");
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchAccount = async () => {
    setIsSubmitting(true);
    clearFeedback();
    try {
      if (signOutCurrentUser) {
        await signOutCurrentUser();
      }

      switchToExistingAccountLogin();
    } catch (error) {
      setOperationError([error instanceof Error ? error.message : text.connectFailedMessage]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const declineInvitation = async () => {
    if (!invitationKey) {
      setOperationError([text.invalidInvitationMessage]);
      return;
    }

    setIsSubmitting(true);
    clearFeedback();
    try {
      const response = await adapter.declineInvitation({ userInvitationKey: invitationKey, message: responseMessage.trim() || undefined });
      if (!response.success) {
        setOperationError(joinResultMessages(response, text.declineFailedMessage));
        return;
      }

      setDetails(null);
      setDecliningInvitation(false);
      setFeedback({ tone: "success", messages: [text.invitationDeclinedMessage] });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFeedback = () => {
    if (!feedback || feedback.messages.length === 0) {
      return null;
    }

    return (
      <div className={`alert alert-${feedback.tone}`} role="alert">
        {feedback.messages.map((message, index) => (
          <div key={index}>{message}</div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={[classNames?.container ?? "col-12 my-4", className].filter(Boolean).join(" ")}>
        <div className={classNames?.card ?? "card"}>
          <div className={classNames?.body ?? "card-body"}>{text.loadingInvitationMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={[classNames?.container ?? "col-12 my-4", className].filter(Boolean).join(" ")}>
      <div className={classNames?.card ?? "card"}>
        <div className={classNames?.body ?? "card-body"}>
          <h3 className="card-title">{text.title}</h3>
          {renderFeedback()}

          {details && (
            <>
              {decliningInvitation ? (
                <>
                  <div className={classNames?.infoAlert ?? "alert alert-info"}>
                    <p className="mb-2">
                      {formatAuthText(text.invitedToJoinMessage, {
                        accountName: details.accountName ?? "",
                        email: details.email
                      })}
                    </p>
                    {invitedByText && (
                      <p className="mb-0">
                        {formatAuthText(text.invitationSentByMessage, { invitedBy: invitedByText })}
                      </p>
                    )}
                  </div>
                  <div className={classNames?.declineCard ?? ""}>
                  <h5>{text.declineTitle}</h5>
                  <div className="alert alert-danger">{text.declineConfirmationBody}</div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor={declineMessageId}>{text.declineMessageLabel}</label>
                    <textarea id={declineMessageId} className="form-control" rows={3} value={responseMessage} onChange={event => setResponseMessage(event.target.value)} />
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary" disabled={isSubmitting} onClick={() => {
                      clearFeedback();
                      setResponseMessage("");
                      setShowAccountChoice(!currentUser);
                      setDecliningInvitation(false);
                    }}>
                      {text.cancelLabel}
                    </button>
                    <button type="button" className="btn btn-danger" disabled={isSubmitting} onClick={() => void declineInvitation()}>
                      {isSubmitting ? text.decliningInvitationLabel : text.declineInvitationLabel}
                    </button>
                  </div>
                  </div>
                </>
              ) : (
                <>
                  <div className={classNames?.infoAlert ?? "alert alert-info"}>
                    <p className="mb-2">
                      {formatAuthText(text.invitedToJoinMessage, {
                        accountName: details.accountName ?? "",
                        email: details.email
                      })}
                    </p>
                    {invitedByText && (
                      <p className="mb-2">
                        {formatAuthText(text.invitationSentByMessage, {
                          invitedBy: invitedByText
                        })}
                      </p>
                    )}
                    {showPendingInvitationActions && (
                      <p className="mb-0">
                        {text.declineInvitationHintMessage}{" "}
                        <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={() => openDeclineInvitation()}>
                          {text.declineLinkLabel}
                        </button>
                      </p>
                    )}
                  </div>

                  {showPendingInvitationActions && currentUser && (
                    <div className={classNames?.currentAccountCard ?? "card border-0 mb-4"}>
                      <div className="card-body px-0">
                        <h5>{text.useCurrentAccountHeading}</h5>
                        <div className="text-light small mb-3">
                          <strong>{text.currentAccountIntroMessage}</strong>
                          <br />
                          {formatAuthText(text.currentAccountDetailsMessage, {
                            name: currentUserName || currentUserEmail || text.currentUserFallbackLabel,
                            email: currentUserEmail,
                            provider: currentUserProvider || text.loginProviderFallbackLabel
                          })}
                        </div>
                        {alreadyBelongsToTenant ? (
                          <>
                            <div className="alert alert-info mb-3">{text.alreadyBelongsMessage}</div>
                            <button type="button" className="btn btn-outline-secondary" disabled={isSubmitting} onClick={() => void switchAccount()}>
                              {isSubmitting ? text.switchingAccountLabel : text.useAnotherAccountLabel}
                            </button>
                          </>
                        ) : currentAccountRestrictedByEmail ? (
                          <>
                            <div className="alert alert-info mb-3">
                              {formatAuthText(text.restrictedEmailMessage, { invitedEmail: details.email })}
                            </div>
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              disabled={isSubmitting}
                              onClick={() => openDeclineInvitation(formatAuthText(text.requestInvitationUpdateMessage, { email: currentUserEmail }))}
                            >
                              {text.requestInvitationUpdateLabel}
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="alert alert-info mb-3">{text.useCurrentAccountDescription}</div>
                            <div className="d-flex flex-wrap gap-2">
                            <button type="button" className="btn btn-primary" disabled={isSubmitting} onClick={() => void connectCurrentAccount()}>
                              {isSubmitting ? text.usingCurrentAccountLabel : text.useCurrentAccountLabel}
                            </button>
                              <button type="button" className="btn btn-outline-secondary" disabled={isSubmitting} onClick={() => void switchAccount()}>
                                {isSubmitting ? text.switchingAccountLabel : text.useAnotherAccountLabel}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {showPendingInvitationActions && !currentUser && (
                    <div className={showAccountChoice ? classNames?.currentAccountCard ?? "card" : showExistingAccountLogin ? classNames?.existingAccountCard ?? "card" : classNames?.createAccountCard ?? "card"}>
                      <div className="card-body">
                        {showAccountChoice ? (
                          <>
                            <h5>{text.accountChoiceHeading}</h5>
                            <p className="mb-3">{text.accountChoiceDescription}</p>
                            <div className="d-flex flex-wrap gap-2">
                              <button type="button" className="btn btn-primary" disabled={isSubmitting} onClick={switchToExistingAccountLogin}>
                                {text.existingAccountHeading}
                              </button>
                              <button type="button" className="btn btn-outline-secondary" disabled={isSubmitting} onClick={switchToCreateAccount}>
                                {text.createNewAccountInsteadLabel}
                              </button>
                            </div>
                          </>
                        ) : showExistingAccountLogin ? (
                          <>
                            <h5>{text.existingAccountHeading}</h5>
                            {!details.canChangeEmailAddress && (
                              <div className="alert alert-info py-2">
                                {formatAuthText(text.restrictedLoginGuidanceMessage, { invitedEmail: details.email })}
                              </div>
                            )}
                            {existingAccountLogin ? (
                              <LoginPanel
                                key={`invitation-login-${details.canChangeEmailAddress ? "any" : details.email}`}
                                {...existingAccountLogin}
                                initialLoginIdentifier={details.canChangeEmailAddress ? undefined : details.email}
                                loginIdentifierReadOnly={!details.canChangeEmailAddress}
                                onAuthenticated={() => void connectCurrentAccount()}
                              />
                            ) : (
                              <>
                                <div className="row g-3">
                                  <div className="col-12 col-md-6">
                                    <label className="form-label" htmlFor={existingEmailId}>{text.existingAccountEmailLabel}</label>
                                    <input id={existingEmailId} type="email" className="form-control" value={existingEmail} readOnly={!details.canChangeEmailAddress} onChange={event => setExistingEmail(event.target.value)} />
                                  </div>
                                  <div className="col-12 col-md-6">
                                    <label className="form-label" htmlFor={existingPasswordId}>{text.existingAccountPasswordLabel}</label>
                                    <input id={existingPasswordId} type="password" className="form-control" value={existingPassword} onChange={event => setExistingPassword(event.target.value)} />
                                  </div>
                                </div>
                                <div className="mt-3 d-flex justify-content-end">
                                  <button type="button" className="btn btn-primary" disabled={isSubmitting} onClick={() => void connectExistingAccount()}>
                                    {isSubmitting ? text.connectingExistingAccountLabel : text.connectExistingAccountLabel}
                                  </button>
                                </div>
                              </>
                            )}
                            <button type="button" className="btn btn-link px-0 mt-3" disabled={isSubmitting} onClick={switchToCreateAccount}>
                              {text.createNewAccountInsteadLabel}
                            </button>
                          </>
                        ) : (
                          <>
                            <h5>{text.createAccountHeading}</h5>
                            <div className="row g-3">
                              <div className="col-12 col-md-6">
                                <label className="form-label" htmlFor={firstNameId}>{text.firstNameLabel}</label>
                                <input id={firstNameId} type="text" className="form-control" value={firstName} onChange={event => setFirstName(event.target.value)} />
                              </div>
                              <div className="col-12 col-md-6">
                                <label className="form-label" htmlFor={lastNameId}>{text.lastNameLabel}</label>
                                <input id={lastNameId} type="text" className="form-control" value={lastName} onChange={event => setLastName(event.target.value)} />
                              </div>
                              <div className="col-12">
                                <label className="form-label" htmlFor={emailId}>{text.emailAddressLabel}</label>
                                <input
                                  id={emailId}
                                  type="email"
                                  className="form-control"
                                  value={email}
                                  readOnly={!details.canChangeEmailAddress}
                                  onChange={event => setEmail(event.target.value)}
                                />
                              </div>
                              {extensionContent && <div className="col-12">{extensionContent}</div>}
                              <div className="col-12 col-md-6">
                                <label className="form-label" htmlFor={passwordId}>{text.passwordLabel}</label>
                                <input id={passwordId} type="password" className="form-control" value={password} onChange={event => setPassword(event.target.value)} />
                              </div>
                              <div className="col-12 col-md-6">
                                <label className="form-label" htmlFor={confirmPasswordId}>{text.confirmPasswordLabel}</label>
                                <input id={confirmPasswordId} type="password" className="form-control" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} />
                              </div>
                              <div className="col-12">
                                <PasswordRulesChecklist password={password} confirmPassword={confirmPassword} minimumLength={minimumPasswordLength} />
                              </div>
                              <div className="col-12">
                                <div className="form-check">
                                  <input className="form-check-input" type="checkbox" id="btInvitationTermsAccepted" checked={termsAccepted} onChange={event => setTermsAccepted(event.target.checked)} />
                                  <label className="form-check-label" htmlFor="btInvitationTermsAccepted">
                                    {text.termsAcceptedLabel}{" "}
                                    <a href={termsUrl} target="_blank" rel="noreferrer">{text.termsLinkLabel}</a>
                                  </label>
                                </div>
                              </div>
                              <div className="col-12">
                                <div className="form-check">
                                  <input className="form-check-input" type="checkbox" id="btInvitationPrivacyAccepted" checked={privacyPolicyAccepted} onChange={event => setPrivacyPolicyAccepted(event.target.checked)} />
                                  <label className="form-check-label" htmlFor="btInvitationPrivacyAccepted">
                                    {text.privacyPolicyAcceptedLabel}{" "}
                                    <a href={privacyUrl} target="_blank" rel="noreferrer">{text.privacyPolicyLinkLabel}</a>
                                  </label>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 d-flex justify-content-between align-items-center gap-2 flex-wrap">
                              <button type="button" className="btn btn-link px-0" disabled={isSubmitting} onClick={switchToExistingAccountLogin}>
                                {text.alreadyHaveAccountLabel}
                              </button>
                              <button type="button" className="btn btn-primary" disabled={isSubmitting} onClick={() => void acceptInvitation()}>
                                {isSubmitting ? text.acceptingInvitationLabel : text.acceptInvitationLabel}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
