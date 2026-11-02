import { useRef, useState } from "react";
import { PasswordField } from "./PasswordField";
import { isPasswordValid, PasswordRulesChecklist, type PasswordRule } from "./PasswordRulesChecklist";

export interface ResetPasswordFormProps {
  minimumPasswordLength?: number;
  passwordRules?: PasswordRule[];
  requireCurrentPassword?: boolean;
  busy?: boolean;
  submitLabel?: string;
  busyLabel?: string;
  currentPasswordLabel?: string;
  newPasswordLabel?: string;
  confirmPasswordLabel?: string;
  invalidPasswordMessage?: string;
  mismatchMessage?: string;
  onSubmit: (password: string, currentPassword?: string) => Promise<void> | void;
}

export function ResetPasswordForm({
  minimumPasswordLength = 8, passwordRules = ["minLength", "match"], requireCurrentPassword = false,
  busy, submitLabel = "Update password", busyLabel = "Updating...",
  currentPasswordLabel = "Current password", newPasswordLabel = "New password", confirmPasswordLabel = "Confirm password",
  invalidPasswordMessage, mismatchMessage = "Passwords don't match.", onSubmit
}: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);
  return <form onSubmit={async event => {
    event.preventDefault();
    if (busy || inFlight.current) return;
    if (password !== confirmPassword) { setError(mismatchMessage); return; }
    if (password.length < minimumPasswordLength || !isPasswordValid(password, confirmPassword, minimumPasswordLength, passwordRules)) {
      setError(invalidPasswordMessage ?? `Password must be at least ${minimumPasswordLength} characters and meet the listed requirements.`);
      return;
    }
    if (requireCurrentPassword && !currentPassword) return;
    setError(""); inFlight.current = true; setSubmitting(true);
    try { await onSubmit(password, currentPassword); }
    finally { inFlight.current = false; setSubmitting(false); }
  }}>
    {error && <div role="alert" className="alert alert-danger py-2">{error}</div>}
    <fieldset disabled={busy || submitting}>
      {requireCurrentPassword && <PasswordField className="mb-3" label={currentPasswordLabel} value={currentPassword} autoComplete="current-password" required onChange={setCurrentPassword} />}
      <PasswordField className="mb-3" label={newPasswordLabel} value={password} autoComplete="new-password" required onChange={setPassword} />
      <PasswordField className="mb-3" label={confirmPasswordLabel} value={confirmPassword} autoComplete="new-password" required onChange={setConfirmPassword} />
      <PasswordRulesChecklist password={password} confirmPassword={confirmPassword} minimumLength={minimumPasswordLength} rules={passwordRules} />
      <button type="submit" className="btn btn-primary w-100 mt-3">{busy || submitting ? busyLabel : submitLabel}</button>
    </fieldset>
  </form>;
}
