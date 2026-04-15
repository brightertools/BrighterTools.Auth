import { useAuth } from "../hooks/useAuth";
import { OnboardingCard } from "../components/OnboardingCard";

export const OnboardingPage = () => {
  const { session } = useAuth();
  return session ? <OnboardingCard onboarding={session.onboarding} /> : null;
};
