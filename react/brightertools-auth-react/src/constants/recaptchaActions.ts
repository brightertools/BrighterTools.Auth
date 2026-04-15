export const ReCaptchaActions = {
    signup: "signup",
    loginPassword: "login_password",
    acceptInvitation: "accept_invitation",
    passwordResetRequest: "password_reset_request",
    resetPassword: "reset_password"
} as const;

export type ReCaptchaAction = (typeof ReCaptchaActions)[keyof typeof ReCaptchaActions];
