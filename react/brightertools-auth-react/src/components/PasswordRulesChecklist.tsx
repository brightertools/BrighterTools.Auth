import { useEffect, useMemo } from "react";

export type PasswordRule = "minLength" | "specialChar" | "number" | "capital" | "lowercase" | "match";

export interface PasswordRulesChecklistProps {
  password: string;
  confirmPassword?: string;
  minimumLength?: number;
  rules?: PasswordRule[];
  showWhenEmpty?: boolean;
  onValidityChange?: (isValid: boolean) => void;
}

const defaultRules: PasswordRule[] = ["minLength", "specialChar", "number", "capital", "match"];

export function isPasswordValid(password: string, confirmPassword = "", minimumLength = 8, rules: PasswordRule[] = defaultRules) {
  return rules.every(rule => {
    if (rule === "minLength") return password.length >= minimumLength;
    if (rule === "specialChar") return /[^A-Za-z0-9]/.test(password);
    if (rule === "number") return /\d/.test(password);
    if (rule === "capital") return /[A-Z]/.test(password);
    if (rule === "lowercase") return /[a-z]/.test(password);
    if (rule === "match") return password.length > 0 && password === confirmPassword;
    return true;
  });
}

function ruleLabel(rule: PasswordRule, minimumLength: number) {
  if (rule === "minLength") return `At least ${minimumLength} characters`;
  if (rule === "specialChar") return "At least one special character";
  if (rule === "number") return "At least one number";
  if (rule === "capital") return "At least one uppercase letter";
  if (rule === "lowercase") return "At least one lowercase letter";
  return "Passwords match";
}

function ruleMet(rule: PasswordRule, password: string, confirmPassword: string, minimumLength: number) {
  return isPasswordValid(password, confirmPassword, minimumLength, [rule]);
}

export function PasswordRulesChecklist({ password, confirmPassword = "", minimumLength = 8, rules = defaultRules, showWhenEmpty = false, onValidityChange }: PasswordRulesChecklistProps) {
  const visible = showWhenEmpty || password.length > 0 || confirmPassword.length > 0;
  const results = useMemo(() => rules.map(rule => ({ rule, met: ruleMet(rule, password, confirmPassword, minimumLength) })), [confirmPassword, minimumLength, password, rules]);
  const isValid = results.every(result => result.met);

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  if (!visible) return null;

  return (
    <ul className="bt-auth-password-rules list-unstyled small mb-0 mt-2" aria-live="polite">
      {results.map(result => (
        <li key={result.rule} className={result.met ? "text-success" : "text-muted"}>
          <span className="me-1" aria-hidden="true">{result.met ? "✓" : "○"}</span>
          {ruleLabel(result.rule, minimumLength)}
        </li>
      ))}
    </ul>
  );
}
