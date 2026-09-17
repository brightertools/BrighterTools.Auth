import { useCallback, useMemo } from "react";
import { useAuth } from "./useAuth";
import type { BeginLoginEmailChangeRequest, BeginNotificationEmailChangeRequest, ChangePasswordRequest, CompletePasswordSetupRequest, ExternalLoginRequest, VerifyLoginEmailChangeCodeRequest, VerifyNotificationEmailChangeCodeRequest } from "../types/api";
import type { LinkedProvider } from "../types/auth";

export const useLoginMethods = () => {
  const { api } = useAuth();

  const load = useCallback(() => api.loginMethods(), [api]);
  const linkedProviders = useCallback(() => api.linkedProviders(), [api]);
  const linkProvider = useCallback((request: ExternalLoginRequest) => api.linkProvider(request), [api]);
  const unlinkProvider = useCallback((request: Pick<LinkedProvider, "provider" | "providerSubject">) => api.unlinkProvider(request), [api]);
  const beginLoginEmailChange = useCallback((request: BeginLoginEmailChangeRequest) => api.beginLoginEmailChange(request), [api]);
  const verifyLoginEmailChangeCode = useCallback((request: VerifyLoginEmailChangeCodeRequest) => api.verifyLoginEmailChangeCode(request), [api]);
  const beginNotificationEmailChange = useCallback((request: BeginNotificationEmailChangeRequest) => api.beginNotificationEmailChange(request), [api]);
  const selectNotificationEmail = useCallback((email: string) => api.selectNotificationEmail({ email }), [api]);
  const removeContactEmail = useCallback((email: string) => api.removeContactEmail({ email }), [api]);
  const verifyNotificationEmailChangeCode = useCallback((request: VerifyNotificationEmailChangeCodeRequest) => api.verifyNotificationEmailChangeCode(request), [api]);
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
    beginNotificationEmailChange,
    selectNotificationEmail,
    removeContactEmail,
    verifyNotificationEmailChangeCode,
    beginPasswordSetup,
    completePasswordSetup,
    changePassword,
    removePasswordLogin
  }), [beginLoginEmailChange, beginNotificationEmailChange, selectNotificationEmail, removeContactEmail, beginPasswordSetup, changePassword, completePasswordSetup, linkProvider, linkedProviders, load, removePasswordLogin, unlinkProvider, verifyLoginEmailChangeCode, verifyNotificationEmailChangeCode]);
};
