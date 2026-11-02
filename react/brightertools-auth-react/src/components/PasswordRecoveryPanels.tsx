import { useEffect, useRef, useState } from "react";
import { ForgotPasswordForm, type ForgotPasswordFormProps } from "./ForgotPasswordForm";
import { ResetPasswordForm, type ResetPasswordFormProps } from "./ResetPasswordForm";
import { useAuth } from "../hooks/useAuth";
import type { ApiEnvelope } from "../services/createAuthApi";

export type PasswordActionResult = Pick<ApiEnvelope<unknown>, "success" | "message">;

function useOperationLifetime() {
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  return active;
}

interface FeedbackProps {
  successMessage?: string;
  errorMessage?: string;
}

export interface ForgotPasswordPanelProps extends FeedbackProps {
  formProps?: Omit<ForgotPasswordFormProps, "busy" | "onSubmit">;
  hideFormOnSuccess?: boolean;
  /** Optional host transport for existing contracts, CAPTCHA and response mapping. */
  requestReset?: (email: string) => Promise<PasswordActionResult>;
}

export function ForgotPasswordPanel({
  successMessage = "If an account exists for that email address, a reset link has been sent.",
  errorMessage = "We could not start the password reset. Please try again.",
  formProps, hideFormOnSuccess = false, requestReset
}: ForgotPasswordPanelProps) {
  const { api } = useAuth();
  const active = useOperationLifetime();
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const onSubmit = async (email: string) => {
    setError(""); setComplete(false); setBusy(true);
    try {
      const result = await (requestReset ? requestReset(email) : api.beginPasswordReset(email));
      if (!active.current) return;
      if (!result.success) { setError(result.message || errorMessage); return; }
      setComplete(true);
    } catch { setError(errorMessage); }
    finally { setBusy(false); }
  };
  return <div className="bt-auth-forgot-password-panel">
    {complete && <div role="status" className="alert alert-success py-2">{successMessage}</div>}
    {error && <div role="alert" className="alert alert-danger py-2">{error}</div>}
    {!(complete && hideFormOnSuccess) && <ForgotPasswordForm {...formProps} busy={busy} onSubmit={onSubmit} />}
  </div>;
}

export interface ResetPasswordPanelProps extends FeedbackProps {
  token?: string | null;
  minimumPasswordLength?: number;
  missingTokenMessage?: string;
  invalidTokenMessage?: string;
  formProps?: Omit<ResetPasswordFormProps, "busy" | "onSubmit" | "minimumPasswordLength">;
  completeReset?: (token: string, password: string) => Promise<PasswordActionResult>;
  onPasswordReset?: () => void;
}

export function ResetPasswordPanel(props: ResetPasswordPanelProps) {
  // A different link starts a new operation; old asynchronous results cannot replace its UI.
  return <ResetPasswordOperation key={props.token ?? ""} {...props} />;
}

function ResetPasswordOperation({
  token, minimumPasswordLength = 8,
  successMessage = "Your password has been updated. You can now sign in.",
  missingTokenMessage = "The reset link is missing a token.",
  invalidTokenMessage = "This reset link is invalid or has expired.",
  errorMessage, formProps, completeReset, onPasswordReset
}: ResetPasswordPanelProps) {
  const { api } = useAuth();
  const active = useOperationLifetime();
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const onSubmit = async (password: string) => {
    if (!token) return;
    setError(""); setBusy(true);
    try {
      const result = await (completeReset ? completeReset(token, password) : api.completePasswordReset(token, password));
      if (!active.current) return;
      if (!result.success) { setError(result.message || invalidTokenMessage); return; }
      setComplete(true);
      onPasswordReset?.();
    } catch { setError(errorMessage || invalidTokenMessage); }
    finally { setBusy(false); }
  };
  return <div className="bt-auth-reset-password-panel">
    {complete && <div role="status" className="alert alert-success py-2">{successMessage}</div>}
    {(!token || error) && <div role="alert" className="alert alert-danger py-2">{!token ? missingTokenMessage : error}</div>}
    {!complete && token && <ResetPasswordForm {...formProps} minimumPasswordLength={minimumPasswordLength} busy={busy} onSubmit={onSubmit} />}
  </div>;
}

export interface ChangePasswordPanelProps extends FeedbackProps {
  minimumPasswordLength?: number;
  formProps?: Omit<ResetPasswordFormProps, "busy" | "onSubmit" | "minimumPasswordLength" | "requireCurrentPassword">;
  changePassword?: (currentPassword: string, newPassword: string) => Promise<PasswordActionResult>;
  onPasswordChanged?: () => void;
}

export function ChangePasswordPanel({
  minimumPasswordLength = 8, formProps, changePassword, onPasswordChanged,
  successMessage = "Your password has been updated successfully.",
  errorMessage = "Your password could not be updated. Please try again."
}: ChangePasswordPanelProps) {
  const { api } = useAuth();
  const active = useOperationLifetime();
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (newPassword: string, currentPassword = "") => {
    setError(""); setBusy(true);
    try {
      const result = await (changePassword ? changePassword(currentPassword, newPassword) : api.changePassword({ currentPassword, newPassword }));
      if (!active.current) return;
      if (!result.success) { setError(result.message || errorMessage); return; }
      setComplete(true);
      onPasswordChanged?.();
    } catch { setError(errorMessage); }
    finally { setBusy(false); }
  };
  return <div className="bt-auth-change-password-panel">
    {complete && <div role="status" className="alert alert-success py-2">{successMessage}</div>}
    {error && <div role="alert" className="alert alert-danger py-2">{error}</div>}
    {!complete && <ResetPasswordForm {...formProps} requireCurrentPassword minimumPasswordLength={minimumPasswordLength} busy={busy} onSubmit={submit} />}
  </div>;
}
