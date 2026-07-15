import { useState } from "react";
import { PasswordField } from "./PasswordField";

export interface PasswordLoginFormProps {
  emailLabel?: string;
  loginLabel?: string;
  loginInputType?: "email" | "text";
  loginAutoComplete?: string;
  passwordLabel?: string;
  submitLabel?: string;
  submittingLabel?: string;
  initialLogin?: string;
  busy?: boolean;
  onSubmit: (request: { login: string; password: string }) => Promise<void> | void;
}

export function PasswordLoginForm({
  emailLabel = "Email",
  loginLabel,
  loginInputType = "email",
  loginAutoComplete = "email",
  passwordLabel = "Password",
  submitLabel = "Sign in",
  submittingLabel = "Signing in...",
  initialLogin = "",
  busy,
  onSubmit
}: PasswordLoginFormProps) {
  const [login, setLogin] = useState(initialLogin);
  const [password, setPassword] = useState("");
  const resolvedLoginLabel = loginLabel ?? emailLabel;

  return (
    <form
      onSubmit={async event => {
        event.preventDefault();
        await onSubmit({ login, password });
      }}
    >
      <div className="mb-3">
        <label className="form-label">{resolvedLoginLabel}</label>
        <input type={loginInputType} autoComplete={loginAutoComplete} className="form-control" value={login} onChange={event => setLogin(event.target.value)} required />
      </div>
      <PasswordField className="mb-3" label={passwordLabel} value={password} autoComplete="current-password" required onChange={setPassword} />
      <button type="submit" className="btn btn-primary w-100" disabled={busy}>
        {busy ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}



