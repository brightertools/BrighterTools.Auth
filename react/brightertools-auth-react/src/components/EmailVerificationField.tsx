import { useEffect, useRef } from "react";

export interface EmailVerificationFieldProps {
  email: string;
  verified: boolean;
  challengeActive?: boolean;
  verificationCode?: string;
  busySending?: boolean;
  busyVerifying?: boolean;
  disabled?: boolean;
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
  successMessage?: string;
  errorMessage?: string;
  autoSubmitCodeLength?: number;
  onEmailChange: (email: string) => void;
  onRequestVerification: (email: string) => Promise<void> | void;
  onVerificationCodeChange: (code: string) => void;
  onVerifyCode: () => Promise<void> | void;
  onChangeEmail?: () => void;
  onResend?: () => Promise<void> | void;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

export function EmailVerificationField({
  email,
  verified,
  challengeActive = false,
  verificationCode = "",
  busySending = false,
  busyVerifying = false,
  disabled = false,
  emailPlaceholder = "Enter your email address",
  codePlaceholder = "Enter verification code",
  sendLabel = "Verify email",
  sendingLabel = "Sending...",
  verifyLabel = "Verify code",
  verifyingLabel = "Verifying...",
  verifiedLabel = "Verified",
  changeEmailAddressLabel = "change email address",
  changeEmailLabel = "change email",
  resendCodeLabel = "re-send code",
  successMessage,
  errorMessage,
  autoSubmitCodeLength = 6,
  onEmailChange,
  onRequestVerification,
  onVerificationCodeChange,
  onVerifyCode,
  onChangeEmail,
  onResend
}: EmailVerificationFieldProps) {
  const lastAutoSubmittedCodeRef = useRef("");
  const verifyingRef = useRef(false);
  const isBusy = busySending || busyVerifying;
  const trimmedEmail = email.trim();
  const canSend = !disabled && !isBusy && isValidEmail(trimmedEmail);
  const normalizeCode = (value: string) => value.replace(/\D/g, "").slice(0, autoSubmitCodeLength);
  const normalizedVerificationCode = normalizeCode(verificationCode);

  const verifyCode = async () => {
    if (verifyingRef.current || busyVerifying || disabled || verified) return;
    if (normalizedVerificationCode.length !== autoSubmitCodeLength) return;

    verifyingRef.current = true;
    try {
      await onVerifyCode();
    } finally {
      verifyingRef.current = false;
    }
  };

  useEffect(() => {
    if (!challengeActive || verified || busyVerifying || normalizedVerificationCode.length < autoSubmitCodeLength) return;
    if (normalizedVerificationCode === lastAutoSubmittedCodeRef.current) return;

    lastAutoSubmittedCodeRef.current = normalizedVerificationCode;
    void verifyCode();
  }, [autoSubmitCodeLength, busyVerifying, challengeActive, normalizedVerificationCode, verified]);

  const changeEmail = () => {
    lastAutoSubmittedCodeRef.current = "";
    verifyingRef.current = false;
    onVerificationCodeChange("");
    onChangeEmail?.();
  };

  const sendVerification = async () => {
    lastAutoSubmittedCodeRef.current = "";
    verifyingRef.current = false;
    await onRequestVerification(trimmedEmail);
  };

  if (verified) {
    return (
      <div className="bt-auth-email-verification-field">
        <div className="input-group">
          <input type="email" className="form-control bg-light" value={email} readOnly aria-label="Verified email address" />
          <span className="input-group-text bg-success text-white fw-semibold">{verifiedLabel}</span>
        </div>
        <button type="button" className="btn btn-link btn-sm px-0 text-decoration-none text-primary" disabled={disabled || isBusy} onClick={changeEmail}>
          {changeEmailAddressLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="bt-auth-email-verification-field">
      {!challengeActive && (
        <div className="input-group">
          <input
            type="email"
            className={`form-control ${errorMessage ? "is-invalid" : ""}`}
            value={email}
            placeholder={emailPlaceholder}
            disabled={disabled || isBusy}
            onChange={event => onEmailChange(event.target.value)}
          />
          <button type="button" className="btn btn-primary" disabled={!canSend} onClick={() => void sendVerification()}>
            {busySending ? sendingLabel : sendLabel}
          </button>
        </div>
      )}

      {challengeActive && (
        <div className="row g-2 align-items-start">
          <div className="col-sm">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className={`form-control ${errorMessage ? "is-invalid" : ""}`}
              value={verificationCode}
              placeholder={codePlaceholder}
              disabled={disabled || busyVerifying}
              onChange={event => onVerificationCodeChange(normalizeCode(event.target.value))}
              onPaste={event => {
                const pasted = normalizeCode(event.clipboardData.getData("text"));
                if (pasted.length >= autoSubmitCodeLength) {
                  event.preventDefault();
                  onVerificationCodeChange(pasted);
                }
              }}
            />
          </div>
          <div className="col-sm-auto" style={{ minWidth: 150 }}>
            <button type="button" className="btn btn-outline-primary text-primary w-100" disabled={disabled || busyVerifying || normalizedVerificationCode.length !== autoSubmitCodeLength} onClick={() => void verifyCode()}>
              {busyVerifying ? verifyingLabel : verifyLabel}
            </button>
          </div>
        </div>
      )}

      {errorMessage && <div className="invalid-feedback d-block">{errorMessage}</div>}
      {successMessage && !verified && <div className="form-text text-info fw-medium">{successMessage}</div>}

      {challengeActive && (
        <div className="d-flex flex-wrap gap-2 mt-1 small">
          <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none text-primary" disabled={disabled || isBusy} onClick={changeEmail}>
            {changeEmailLabel}
          </button>
          <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none text-primary" disabled={disabled || busySending} onClick={() => void (onResend ? onResend() : sendVerification())}>
            {resendCodeLabel}
          </button>
        </div>
      )}
    </div>
  );
}
