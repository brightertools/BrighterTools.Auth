import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { VerifyEmailPanel } from "./VerifyEmailPanel";
import { useAuth } from "../hooks/useAuth";

export type VerifyEmailPurpose = "email-verification" | "login-email-change" | string;

export interface VerifyEmailLinkPanelProps {
  token?: string | null;
  purpose?: VerifyEmailPurpose;
  successAction?: ReactNode;
  errorAction?: ReactNode;
  missingTokenMessage?: string;
}

export function VerifyEmailLinkPanel({ token, purpose = "email-verification", successAction, errorAction, missingTokenMessage = "This verification link is missing a token." }: VerifyEmailLinkPanelProps) {
  const { api } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      if (!token) {
        setMessage(missingTokenMessage);
        setStatus("error");
        return;
      }

      try {
        if (purpose === "login-email-change") {
          const response = await api.confirmLoginEmailChange(token);
          if (!response.success) throw new Error(response.message ?? "This verification link is invalid or has expired.");
          if (!cancelled) setMessage(response.data?.message ?? "Your login email has been verified and updated.");
        } else {
          const response = await api.confirmEmailVerification(token);
          if (!response.success) throw new Error(response.message ?? "This verification link is invalid or has expired.");
          if (!cancelled) setMessage("Your email address has been verified.");
        }

        if (!cancelled) setStatus("success");
      } catch (err) {
        if (!cancelled) {
          setMessage(err instanceof Error ? err.message : "This verification link is invalid or has expired.");
          setStatus("error");
        }
      }
    };

    void verify();
    return () => {
      cancelled = true;
    };
  }, [api, missingTokenMessage, purpose, token]);

  return <VerifyEmailPanel status={status} successMessage={message} errorMessage={message} successAction={successAction} errorAction={errorAction} />;
}
