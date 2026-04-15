import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const AuthGuard = ({ children }: PropsWithChildren) => {
  const { session } = useAuth();
  return session ? <>{children}</> : <Navigate to="/login" replace />;
};
