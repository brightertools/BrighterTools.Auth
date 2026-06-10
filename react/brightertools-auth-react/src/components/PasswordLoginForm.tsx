import { useState } from "react";
import { PasswordField } from "./PasswordField";

export interface PasswordLoginFormProps {
  emailLabel?: string;
  passwordLabel?: string;
  submitLabel?: string;
  submittingLabel?: string;
  initialLogin?: string;
  busy?: boolean;
  onSubmit: (request: { login: string; password: string }) => Promise<void> | void;
}

export function PasswordLoginForm({ emailLabel = "Email", passwordLabel = "Password", submitLabel = "Sign in", submittingLabel = "Signing in...", initialLogin = "", busy, onSubmit }: PasswordLoginFormProps) {
  const [login, setLogin] = useState(initialLogin);
  const [password, setPassword] = useState("");

  return (
    <form
      onSubmit={async event => {
        event.preventDefault();
        await onSubmit({ login, password });
      }}
    >
      <div className="mb-3">
        <label className="form-label">{emailLabel}</label>
        <input type="email" className="form-control" value={login} onChange={event => setLogin(event.target.value)} required />
      </div>
      <PasswordField className="mb-3" label={passwordLabel} value={password} autoComplete="current-password" required onChange={setPassword} />
      <button type="submit" className="btn btn-primary w-100" disabled={busy}>
        {busy ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}



