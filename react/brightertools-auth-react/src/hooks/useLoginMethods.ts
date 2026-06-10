import { useCallback, useMemo } from "react";
import { useAuth } from "./useAuth";
import type { BeginLoginEmailChangeRequest, ChangePasswordRequest, CompletePasswordSetupRequest, ExternalLoginRequest, VerifyLoginEmailChangeCodeRequest } from "../types/api";
import type { LinkedProvider } from "../types/auth";

export const useLoginMethods = () => {
  const { api } = useAuth();

  const load = useCallback(() => api.loginMethods(), [api]);
  const linkedProviders = useCallback(() => api.linkedProviders(), [api]);
  const linkProvider = useCallback((request: ExternalLoginRequest) => api.linkProvider(request), [api]);
  const unlinkProvider = useCallback((request: Pick<LinkedProvider, "provider" | "providerSubject">) => api.unlinkProvider(request), [api]);
  const beginLoginEmailChange = useCallback((request: BeginLoginEmailChangeRequest) => api.beginLoginEmailChange(request), [api]);
  const verifyLoginEmailChangeCode = useCallback((request: VerifyLoginEmailChangeCodeRequest) => api.verifyLoginEmailChangeCode(request), [api]);
  const beginPasswordSetup = useCallback(() => api.beginPasswordSetup(), [api]);
  const completePasswordSetup = useCallback((request: CompletePasswordSetupRequest) => api.completePasswordSetup(request), [api]);
  const changePassword = useCallback((request: ChangePasswordRequest) => api.changePassword(request), [api]);
  const removePasswordLogin = useCallback(() => api.removePasswordLogin(), [api]);

  return useMemo(() => ({
    load,
    linkedProviders,
    linkProvider,
    unlinkProvider,
    beginLoginEmailChange,
    verifyLoginEmailChangeCode,
    beginPasswordSetup,
    completePasswordSetup,
    changePassword,
    removePasswordLogin
  }), [beginLoginEmailChange, beginPasswordSetup, changePassword, completePasswordSetup, linkProvider, linkedProviders, load, removePasswordLogin, unlinkProvider, verifyLoginEmailChangeCode]);
};
