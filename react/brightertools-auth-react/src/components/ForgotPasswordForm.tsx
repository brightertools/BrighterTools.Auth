import { useId, useRef, useState } from "react";

export interface ForgotPasswordFormProps {
  busy?: boolean;
  emailLabel?: string;
  submitLabel?: string;
  busyLabel?: string;
  onSubmit: (email: string) => Promise<void> | void;
}

export function ForgotPasswordForm({ busy, emailLabel = "Email", submitLabel = "Send reset link", busyLabel = "Sending...", onSubmit }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);
  const id = useId();
  return <form onSubmit={async event => {
    event.preventDefault();
    if (busy || inFlight.current) return;
    inFlight.current = true; setSubmitting(true);
    try { await onSubmit(email.trim()); }
    finally { inFlight.current = false; setSubmitting(false); }
  }}>
    <fieldset disabled={busy || submitting}>
      <div className="mb-3">
        <label className="form-label" htmlFor={id}>{emailLabel}</label>
        <input id={id} type="email" autoComplete="email" className="form-control" value={email} onChange={event => setEmail(event.target.value)} required />
      </div>
      <button type="submit" className="btn btn-primary w-100">{busy || submitting ? busyLabel : submitLabel}</button>
    </fieldset>
  </form>;
}
