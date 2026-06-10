import type { ReactNode } from "react";

export interface VerifyEmailPanelProps {
  status: "loading" | "success" | "error";
  loadingText?: string;
  successMessage?: ReactNode;
  errorMessage?: ReactNode;
  successAction?: ReactNode;
  errorAction?: ReactNode;
}

export function VerifyEmailPanel({ status, loadingText = "Checking your verification link...", successMessage = "Your email address has been verified.", errorMessage = "This verification link is invalid or has expired.", successAction, errorAction }: VerifyEmailPanelProps) {
  return (
    <div className="text-center bt-auth-verify-email-panel">
      {status === "loading" && (
        <>
          <div className="spinner-border text-primary mx-auto mb-3" role="status" />
          <p className="text-muted">{loadingText}</p>
        </>
      )}
      {status === "success" && (
        <>
          <div className="alert alert-success py-2">{successMessage}</div>
          {successAction}
        </>
      )}
      {status === "error" && (
        <>
          <div className="alert alert-danger py-2">{errorMessage}</div>
          {errorAction}
        </>
      )}
    </div>
  );
}
