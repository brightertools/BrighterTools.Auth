import { useState } from "react";
import { PasswordField } from "./PasswordField";

export interface ResetPasswordFormProps {
  minimumPasswordLength?: number;
  busy?: boolean;
  submitLabel?: string;
  busyLabel?: string;
  onSubmit: (password: string) => Promise<void> | void;
}

export function ResetPasswordForm({ minimumPasswordLength = 8, busy, submitLabel = "Update password", busyLabel = "Updating...", onSubmit }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <form
      onSubmit={async event => {
        event.preventDefault();
        if (password.length < minimumPasswordLength) {
          setError(`Password must be at least ${minimumPasswordLength} characters.`);
          return;
        }
        if (password !== confirmPassword) {
          setError("Passwords don't match.");
          return;
        }
        setError("");
        await onSubmit(password);
      }}
    >
      {error && <div className="alert alert-danger py-2">{error}</div>}
      <PasswordField className="mb-3" label="New password" value={password} autoComplete="new-password" required onChange={setPassword} />
      <PasswordField className="mb-3" label="Confirm password" value={confirmPassword} autoComplete="new-password" required onChange={setConfirmPassword} />
      <button type="submit" className="btn btn-primary w-100" disabled={busy}>
        {busy ? busyLabel : submitLabel}
      </button>
    </form>
  );
}

