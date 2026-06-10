import { useState } from "react";
import { PasswordField } from "./PasswordField";

export interface LegalConsentCheckboxProps {
  checked: boolean;
  termsUrl: string;
  privacyUrl: string;
  appName?: string;
  disabled?: boolean;
  error?: string | null;
  onChange: (checked: boolean) => void;
}

export function LegalConsentCheckbox({ checked, termsUrl, privacyUrl, appName, disabled, error, onChange }: LegalConsentCheckboxProps) {
  return (
    <div className="mb-3">
      <div className="form-check">
        <input id="bt-auth-legal-consent" className={`form-check-input ${error ? "is-invalid" : ""}`} type="checkbox" checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)} />
        <label className="form-check-label small" htmlFor="bt-auth-legal-consent">
          I agree to {appName ? `${appName}'s ` : "the "}
          <a href={termsUrl}>terms</a> and <a href={privacyUrl}>privacy policy</a>.
        </label>
      </div>
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  );
}

export interface PasswordSignupFormProps {
  termsUrl: string;
  privacyUrl: string;
  appName?: string;
  busy?: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  passwordHelpText?: string;
  onSubmit: (request: { email: string; password: string; termsAccepted: boolean; privacyPolicyAccepted: boolean }) => Promise<void> | void;
}

export function PasswordSignupForm({ termsUrl, privacyUrl, appName, busy, submitLabel = "Create account", submittingLabel = "Creating account...", passwordHelpText, onSubmit }: PasswordSignupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [legalError, setLegalError] = useState<string | null>(null);

  return (
    <form
      onSubmit={async event => {
        event.preventDefault();
        if (!legalAccepted) {
          setLegalError("Terms and privacy acceptance is required.");
          return;
        }
        setLegalError(null);
        await onSubmit({ email, password, termsAccepted: legalAccepted, privacyPolicyAccepted: legalAccepted });
      }}
    >
      <div className="mb-3">
        <label className="form-label">Email</label>
        <input type="email" className="form-control" value={email} onChange={event => setEmail(event.target.value)} required />
      </div>
      <div className="mb-3">
        <PasswordField label="Password" value={password} autoComplete="new-password" required onChange={setPassword} />
        {passwordHelpText && <div className="form-text">{passwordHelpText}</div>}
      </div>
      <LegalConsentCheckbox checked={legalAccepted} termsUrl={termsUrl} privacyUrl={privacyUrl} appName={appName} disabled={busy} error={legalError} onChange={setLegalAccepted} />
      <button type="submit" className="btn btn-primary w-100" disabled={busy}>
        {busy ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}



