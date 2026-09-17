import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SignupPanel } from "../components/SignupPanel";

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ login: vi.fn(), externalSignup: vi.fn() })
}));
vi.mock("../hooks/usePasswordSignup", () => ({
  usePasswordSignup: () => vi.fn()
}));
vi.mock("../hooks/useSignupEmailVerification", () => ({
  useSignupEmailVerification: () => ({ begin: vi.fn(), verifyCode: vi.fn() })
}));

describe("SignupPanel consent checkboxes", () => {
  it("uses matching checkbox and label styling while keeping each consent independent", () => {
    render(<SignupPanel appName="Uniiite" signupAgeGateEnabled minimumSignupAge={16}
      signupDateOfBirthRequired signupMinimumAgeConfirmationRequired />);

    const age = screen.getByRole("checkbox", { name: "I confirm I am at least 16 years old." }) as HTMLInputElement;
    const legal = screen.getByRole("checkbox", { name: /I agree to Uniiite's/ }) as HTMLInputElement;
    for (const checkbox of [age, legal]) {
      expect(checkbox.classList.contains("form-check-input")).toBe(true);
      expect(checkbox.parentElement?.classList.contains("form-check")).toBe(true);
      expect(checkbox.labels?.[0].classList.contains("form-check-label")).toBe(true);
      expect(checkbox.labels?.[0].classList.contains("small")).toBe(true);
      expect(checkbox.checked).toBe(false);
    }

    fireEvent.click(age.labels![0]);
    expect(age.checked).toBe(true);
    expect(legal.checked).toBe(false);
    fireEvent.click(legal.labels![0]);
    expect(legal.checked).toBe(true);
    expect(screen.getByRole("link", { name: "terms" }).getAttribute("href")).toBe("/terms");
    expect(screen.getByRole("link", { name: "privacy policy" }).getAttribute("href")).toBe("/privacy");
  });
});
