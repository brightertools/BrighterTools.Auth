import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPanel } from "../components/LoginPanel";

const loginMock = vi.fn();
const externalLoginMock = vi.fn();
const passwordlessBeginMock = vi.fn();
const passwordlessCompleteMock = vi.fn();

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({
    login: loginMock,
    externalLogin: externalLoginMock
  })
}));

vi.mock("../hooks/usePasswordlessEmailLogin", () => ({
  usePasswordlessEmailLogin: () => ({
    begin: passwordlessBeginMock,
    complete: passwordlessCompleteMock
  })
}));

vi.mock("../services/appleAuth", () => ({
  signInWithApple: vi.fn()
}));

vi.mock("../services/microsoftAuth", () => ({
  signInWithMicrosoft: vi.fn()
}));

describe("LoginPanel", () => {
  beforeEach(() => {
    loginMock.mockReset();
    externalLoginMock.mockReset();
    passwordlessBeginMock.mockReset();
    passwordlessCompleteMock.mockReset();
  });

  it("shows inline email login first with a separator when configured", () => {
    render(
      <LoginPanel
        allowUsernameOrEmail
        appleClientId="apple"
        loginEmailUi={{ emailDisplayMode: "inline", emailPlacement: "first", separatorText: "-- or --" }}
        providerUi={[{ provider: "Apple" }]}
      />
    );

    const loginInput = screen.getByLabelText("Username / Email");
    const appleButton = screen.getByRole("button", { name: "Continue with Apple" });
    const separator = screen.getByText("-- or --");

    expect(loginInput.compareDocumentPosition(appleButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(separator).toBeTruthy();
  });

  it("honors copy overrides for provider and email button labels", () => {
    render(
      <LoginPanel
        appleClientId="apple"
        loginEmailUi={{ emailDisplayMode: "button", emailPlacement: "last" }}
        providerUi={[{ provider: "Apple" }]}
        textOverrides={{
          login: {
            continueWithAppleLabel: "Use Apple",
            emailButtonLabel: "Use Email"
          }
        }}
      />
    );

    expect(screen.getByRole("button", { name: "Use Apple" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Use Email" })).toBeTruthy();
  });
});
