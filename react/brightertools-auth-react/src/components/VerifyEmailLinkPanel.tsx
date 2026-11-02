import { useEffect, useRef, useState, type ReactNode } from "react";
import { VerifyEmailPanel } from "./VerifyEmailPanel";
import { useAuth } from "../hooks/useAuth";

export type VerifyEmailPurpose = "email-verification" | "login-email-change" | string;
export interface VerificationResult { success: boolean; message?: string; }
export interface VerifyEmailLinkPanelProps {
  token?: string | null;
  purpose?: VerifyEmailPurpose;
  successAction?: ReactNode;
  errorAction?: ReactNode;
  missingTokenMessage?: string;
  loadingText?: string;
  successMessage?: string;
  errorMessage?: string;
  /** Maps a host's activation contract without duplicating link lifecycle handling. */
  verify?: (token: string, purpose: VerifyEmailPurpose) => Promise<VerificationResult>;
}

export function VerifyEmailLinkPanel(props: VerifyEmailLinkPanelProps) {
  return <VerificationOperation key={JSON.stringify([props.token, props.purpose])} {...props} />;
}

function VerificationOperation({
  token, purpose = "email-verification", successAction, errorAction, verify, loadingText,
  missingTokenMessage = "This verification link is missing a token.",
  successMessage, errorMessage = "This verification link is invalid or has expired."
}: VerifyEmailLinkPanelProps) {
  const { api } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const operation = useRef<Promise<VerificationResult> | null>(null);
  const transport = useRef(verify);
  transport.current = verify;
  useEffect(() => {
    let cancelled = false;
    if (!token) { setMessage(missingTokenMessage); setStatus("error"); return; }
    // Strict Mode replays effects. Share the one request, never consume the link twice.
    operation.current ??= Promise.resolve().then(async () => {
      if (transport.current) return transport.current(token, purpose);
      if (purpose === "login-email-change") {
        const response = await api.confirmLoginEmailChange(token);
        return { success: response.success, message: response.success ? response.data?.message ?? "Your login email has been verified and updated." : response.message };
      }
      const response = await api.confirmEmailVerification(token);
      return { success: response.success, message: response.success ? "Your email address has been verified." : response.message };
    });
    void operation.current.then(result => {
      if (cancelled) return;
      setMessage(result.success ? successMessage ?? result.message ?? "Verified successfully." : result.message || errorMessage);
      setStatus(result.success ? "success" : "error");
    }).catch(error => {
      if (cancelled) return;
      setMessage(error instanceof Error ? error.message : errorMessage); setStatus("error");
    });
    return () => { cancelled = true; };
  }, [api, token, purpose, missingTokenMessage, successMessage, errorMessage]);
  return <VerifyEmailPanel status={status} loadingText={loadingText} successMessage={message} errorMessage={message} successAction={successAction} errorAction={errorAction} />;
}
