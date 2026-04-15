import type { OnboardingState } from "../types/auth";

export const OnboardingCard = ({ onboarding }: { onboarding: OnboardingState }) => (
  <div className="card border-warning">
    <div className="card-body">
      <h2 className="h5">Onboarding</h2>
      <p className="mb-0">Status: {onboarding.status}</p>
    </div>
  </div>
);
