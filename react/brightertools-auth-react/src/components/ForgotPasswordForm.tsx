import { useState } from "react";

export interface ForgotPasswordFormProps {
  busy?: boolean;
  submitLabel?: string;
  busyLabel?: string;
  onSubmit: (email: string) => Promise<void> | void;
}

export function ForgotPasswordForm({ busy, submitLabel = "Send reset link", busyLabel = "Sending...", onSubmit }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");

  return (
    <form
      onSubmit={async event => {
        event.preventDefault();
        await onSubmit(email);
      }}
    >
      <div className="mb-3">
        <label className="form-label">Email</label>
        <input type="email" className="form-control" value={email} onChange={event => setEmail(event.target.value)} required />
      </div>
      <button type="submit" className="btn btn-primary w-100" disabled={busy}>
        {busy ? busyLabel : submitLabel}
      </button>
    </form>
  );
}
