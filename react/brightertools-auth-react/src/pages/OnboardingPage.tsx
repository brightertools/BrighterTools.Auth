import { useAuth } from "../hooks/useAuth.js";
import { OnboardingCard } from "../components/OnboardingCard.js";

export const OnboardingPage = () => {
  const { session } = useAuth();
  return session?.onboarding ? <OnboardingCard onboarding={session.onboarding} /> : null;
};


