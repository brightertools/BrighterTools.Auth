import { useState } from "react";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { usePasswordReset } from "../hooks/usePasswordReset";

export interface ForgotPasswordPanelProps {
  successMessage?: string;
  errorMessage?: string;
}

export function ForgotPasswordPanel({ successMessage = "If an account exists for that email address, a reset link has been sent.", errorMessage = "We could not start the password reset. Please try again." }: ForgotPasswordPanelProps) {
  const passwordReset = usePasswordReset();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (email: string) => {
    setError("");
    setMessage("");
    setBusy(true);

    try {
      await passwordReset.begin(email);
      setMessage(successMessage);
    } catch {
      setError(errorMessage);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bt-auth-forgot-password-panel">
      {message && <div className="alert alert-success py-2">{message}</div>}
      {error && <div className="alert alert-danger py-2">{error}</div>}
      <ForgotPasswordForm busy={busy} onSubmit={onSubmit} />
    </div>
  );
}

export interface ResetPasswordPanelProps {
  token?: string | null;
  minimumPasswordLength?: number;
  successMessage?: string;
  missingTokenMessage?: string;
  invalidTokenMessage?: string;
  onPasswordReset?: () => void;
}

export function ResetPasswordPanel({ token, minimumPasswordLength = 8, successMessage = "Your password has been updated. You can now sign in.", missingTokenMessage = "The reset link is missing a token.", invalidTokenMessage = "This reset link is invalid or has expired.", onPasswordReset }: ResetPasswordPanelProps) {
  const passwordReset = usePasswordReset();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (password: string) => {
    setError("");
    setMessage("");

    if (!token) {
      setError(missingTokenMessage);
      return;
    }

    setBusy(true);
    try {
      await passwordReset.complete(token, password);
      setMessage(successMessage);
      onPasswordReset?.();
    } catch {
      setError(invalidTokenMessage);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bt-auth-reset-password-panel">
      {message && <div className="alert alert-success py-2">{message}</div>}
      {error && <div className="alert alert-danger py-2">{error}</div>}
      {!message && <ResetPasswordForm minimumPasswordLength={minimumPasswordLength} busy={busy} onSubmit={onSubmit} />}
    </div>
  );
}
