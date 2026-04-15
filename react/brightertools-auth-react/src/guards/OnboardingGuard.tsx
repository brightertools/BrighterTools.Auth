import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const OnboardingGuard = ({ children }: PropsWithChildren) => {
  const { session } = useAuth();
  return session?.onboarding.required ? <Navigate to="/onboarding" replace /> : <>{children}</>;
};
