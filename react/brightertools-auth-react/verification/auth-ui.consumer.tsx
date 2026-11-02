import { ForgotPasswordPanel, ResetPasswordPanel, ChangePasswordPanel, VerifyEmailLinkPanel, WorkspaceSignupPanel, LoginPanel } from '../dist/index';
export const passwordWorkflows = <>
  <ForgotPasswordPanel hideFormOnSuccess requestReset={async email => ({ success: !!email })} formProps={{ emailLabel: 'Login email' }} />
  <ResetPasswordPanel token="opaque" completeReset={async (token, password) => ({ success: !!token && !!password })} formProps={{ passwordRules: ['minLength', 'capital', 'match'] }} />
  <ChangePasswordPanel changePassword={async (currentPassword, password) => ({ success: !!currentPassword && !!password })} />
  <VerifyEmailLinkPanel token="opaque" verify={async token => ({ success: !!token })} />
  <WorkspaceSignupPanel detailFields={[{ name: 'company', label: 'Company', required: true }]} mapDetails={details => ({ fields: details })} />
  <LoginPanel passwordlessEnabled={false} />
</>;
