import { useState } from "react";

export interface PasswordlessEmailLoginFormProps {
  challengeId?: string | null;
  busy?: boolean;
  requestLabel?: string;
  requestBusyLabel?: string;
  completeLabel?: string;
  onBegin: (login: string) => Promise<void> | void;
  onComplete: (code: string) => Promise<void> | void;
}

export function PasswordlessEmailLoginForm({ challengeId, busy, requestLabel = "Email me a sign-in code", requestBusyLabel = "Sending...", completeLabel = "Sign in", onBegin, onComplete }: PasswordlessEmailLoginFormProps) {
  const [login, setLogin] = useState("");
  const [code, setCode] = useState("");

  return (
    <div className="bt-auth-passwordless-email">
      <div className="mb-2">
        <label className="form-label">Email</label>
        <input type="email" className="form-control" value={login} onChange={event => setLogin(event.target.value)} />
      </div>
      <button type="button" className="btn btn-outline-primary w-100 mb-3" disabled={busy} onClick={() => void onBegin(login)}>
        {busy ? requestBusyLabel : requestLabel}
      </button>
      {challengeId && (
        <div className="row g-2 align-items-end">
          <div className="col-sm-7">
            <label className="form-label small">Code</label>
            <input className="form-control" inputMode="numeric" value={code} onChange={event => setCode(event.target.value)} />
          </div>
          <div className="col-sm-5">
            <button type="button" className="btn btn-primary w-100" disabled={busy} onClick={() => void onComplete(code)}>
              {completeLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


