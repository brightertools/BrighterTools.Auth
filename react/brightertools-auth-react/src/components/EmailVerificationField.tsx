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

export function EmailVerificationField({ email, verified, challengeActive = false, verificationCode = "", busySending = false, busyVerifying = false, disabled = false, emailPlaceholder = "Enter your email address", codePlaceholder = "Enter verification code", sendLabel = "Verify email", sendingLabel = "Sending...", verifyLabel = "Verify code", verifyingLabel = "Verifying...", verifiedLabel = "Verified", successMessage, errorMessage, autoSubmitCodeLength = 6, onEmailChange, onRequestVerification, onVerificationCodeChange, onVerifyCode, onChangeEmail, onResend }: EmailVerificationFieldProps) {
  const lastAutoSubmittedCodeRef = useRef("");
  const isBusy = busySending || busyVerifying;
  const trimmedEmail = email.trim();
  const canSend = !disabled && !isBusy && isValidEmail(trimmedEmail);

  useEffect(() => {
    if (!challengeActive || verified || busyVerifying || verificationCode.length < autoSubmitCodeLength) return;
    if (verificationCode === lastAutoSubmittedCodeRef.current) return;

    lastAutoSubmittedCodeRef.current = verificationCode;
    void onVerifyCode();
  }, [autoSubmitCodeLength, busyVerifying, challengeActive, onVerifyCode, verificationCode, verified]);

  const changeEmail = () => {
    lastAutoSubmittedCodeRef.current = "";
    onVerificationCodeChange("");
    onChangeEmail?.();
  };

  const sendVerification = async () => {
    lastAutoSubmittedCodeRef.current = "";
    await onRequestVerification(trimmedEmail);
  };

  if (verified) {
    return (
      <div className="bt-auth-email-verification-field">
        <div className="input-group">
          <input type="email" className="form-control bg-light" value={email} readOnly aria-label="Verified email address" />
          <span className="input-group-text bg-success text-white fw-semibold">✓ {verifiedLabel}</span>
        </div>
        <button type="button" className="btn btn-link btn-sm px-0 text-decoration-none" disabled={disabled || isBusy} onClick={changeEmail}>
          change email address
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
              onChange={event => onVerificationCodeChange(event.target.value.trim())}
              onPaste={event => {
                const pasted = event.clipboardData.getData("text").trim();
                if (pasted.length >= autoSubmitCodeLength) onVerificationCodeChange(pasted);
              }}
            />
          </div>
          <div className="col-sm-auto" style={{ minWidth: 150 }}>
            <button type="button" className="btn btn-outline-primary w-100" disabled={disabled || busyVerifying || verificationCode.trim().length === 0} onClick={() => void onVerifyCode()}>
              {busyVerifying ? verifyingLabel : verifyLabel}
            </button>
          </div>
        </div>
      )}

      {errorMessage && <div className="invalid-feedback d-block">{errorMessage}</div>}
      {successMessage && !verified && <div className="form-text text-info">{successMessage}</div>}

      {challengeActive && (
        <div className="d-flex flex-wrap gap-2 mt-1 small">
          <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" disabled={disabled || isBusy} onClick={changeEmail}>
            change email
          </button>
          <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" disabled={disabled || busySending} onClick={() => void (onResend ? onResend() : sendVerification())}>
            re-send code
          </button>
        </div>
      )}
    </div>
  );
}
