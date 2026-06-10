import { PasswordSignupForm } from "../components/SignupForm";

export const SignupPage = () => (
  <div className="container py-5">
    <div className="row justify-content-center">
      <div className="col-md-6">
        <PasswordSignupForm
          termsUrl="/terms"
          privacyUrl="/privacy"
          onSubmit={async () => undefined}
        />
      </div>
    </div>
  </div>
);
