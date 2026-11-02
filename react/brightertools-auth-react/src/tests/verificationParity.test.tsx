import { StrictMode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { VerifyEmailLinkPanel } from "../components/VerifyEmailLinkPanel";
import { LoginPanel } from "../components/LoginPanel";
const api = vi.hoisted(() => ({ confirmEmailVerification: vi.fn(), confirmLoginEmailChange: vi.fn() }));
const passwordless = vi.hoisted(() => ({ begin: vi.fn(), complete: vi.fn() }));
vi.mock("../hooks/useAuth", () => ({ useAuth: () => ({ api }) }));
vi.mock("../hooks/usePasswordlessEmailLogin", () => ({ usePasswordlessEmailLogin: () => passwordless }));
beforeEach(() => vi.resetAllMocks());
it("hides and never exchanges OTP when passwordless is disabled", async () => {
  render(<LoginPanel passwordlessEnabled={false} passwordlessToken="token" loginEmailUi={{ emailDisplayMode: "inline" }} />);
  await act(async () => {});
  expect(screen.queryByText(/code to login/i)).toBeNull();
  expect(passwordless.complete).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Password")).toBeTruthy();
});
it("verifies a link once under Strict Mode and ignores callback identity churn", async () => {
  const verify = vi.fn().mockResolvedValue({ success: true, message: "Activated" });
  const view = render(<StrictMode><VerifyEmailLinkPanel token="token" verify={value => verify(value)} /></StrictMode>);
  await screen.findByText("Activated");
  view.rerender(<StrictMode><VerifyEmailLinkPanel token="token" verify={value => verify(value)} /></StrictMode>);
  expect(verify).toHaveBeenCalledTimes(1);
});
it("uses the default login-email verification route", async () => {
  api.confirmLoginEmailChange.mockResolvedValue({ success: true, data: { message: "Login verified" } });
  render(<VerifyEmailLinkPanel token="token" purpose="login-email-change" />);
  await screen.findByText("Login verified");
  expect(api.confirmEmailVerification).not.toHaveBeenCalled();
});
it("never treats failed verification envelopes as success", async () => {
  api.confirmEmailVerification.mockResolvedValue({ success: false, message: "Expired" });
  render(<VerifyEmailLinkPanel token="token" successAction={<button>Continue</button>} />);
  await screen.findByText("Expired");
  expect(screen.queryByText("Continue")).toBeNull();
});
it("ignores an old verification result after the token changes", async () => {
  let finish!: (result: { success: boolean; message: string }) => void;
  const verify = vi.fn().mockReturnValueOnce(new Promise(resolve => { finish = resolve; })).mockResolvedValueOnce({ success: false, message: "New link expired" });
  const view = render(<VerifyEmailLinkPanel token="first" verify={verify} />);
  await waitFor(() => expect(verify).toHaveBeenCalledTimes(1));
  view.rerender(<VerifyEmailLinkPanel token="second" verify={verify} />);
  await screen.findByText("New link expired");
  await act(async () => finish({ success: true, message: "Old success" }));
  expect(screen.queryByText("Old success")).toBeNull();
});

it("returns to password login when the host disables an open OTP form", () => {
  const view = render(<LoginPanel loginEmailUi={{ emailDisplayMode: "inline" }} />);
  fireEvent.click(screen.getByRole("button", { name: "Send a one-time login code via email" }));
  expect(screen.queryByLabelText("Password")).toBeNull();
  view.rerender(<LoginPanel passwordlessEnabled={false} loginEmailUi={{ emailDisplayMode: "inline" }} />);
  expect(screen.getByLabelText("Password")).toBeTruthy();
  expect(passwordless.begin).not.toHaveBeenCalled();
});