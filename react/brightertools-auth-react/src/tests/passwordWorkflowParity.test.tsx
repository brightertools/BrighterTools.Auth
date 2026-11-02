import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChangePasswordPanel, ForgotPasswordPanel, ResetPasswordPanel } from "../components/PasswordRecoveryPanels";
import { WorkspaceSignupPanel } from "../components/WorkspaceSignupPanel";

const api = vi.hoisted(() => ({ beginPasswordReset: vi.fn(), completePasswordReset: vi.fn(), changePassword: vi.fn() }));
vi.mock("../hooks/useAuth", () => ({ useAuth: () => ({ api }) }));
vi.mock("../components/SignupPanel", () => ({
  SignupPanel: (props: unknown) => <div data-testid="signup-props">{JSON.stringify(props)}</div>
}));
beforeEach(() => { vi.resetAllMocks(); });
const passwordForm = (value = "StrongPassword1!") => {
  fireEvent.change(screen.getByLabelText("New password"), { target: { value } });
  fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value } });
};
describe("shared password workflows", () => {
  it("does not report success for a rejected reset request envelope", async () => {
    api.beginPasswordReset.mockResolvedValue({ success: false, message: "Try later" });
    render(<ForgotPasswordPanel />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Try later");
    expect(screen.queryByRole("status")).toBeNull();
  });
  it("uses the configured transport and hides the form only on success", async () => {
    const requestReset = vi.fn().mockResolvedValue({ success: true });
    render(<ForgotPasswordPanel requestReset={requestReset} hideFormOnSuccess />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    await screen.findByRole("status");
    expect(requestReset).toHaveBeenCalledWith("user@example.test");
    expect(api.beginPasswordReset).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Email")).toBeNull();
  });
  it("does not consume reset tokens on mount or rerender", () => {
    const view = render(<ResetPasswordPanel token="opaque+token" />);
    view.rerender(<ResetPasswordPanel token="opaque+token" />);
    expect(api.completePasswordReset).not.toHaveBeenCalled();
  });
  it("rejects missing reset tokens without presenting a usable form", () => {
    render(<ResetPasswordPanel />);
    expect(screen.getByRole("alert").textContent).toContain("missing");
    expect(screen.queryByLabelText("New password")).toBeNull();
  });
  it("does not call success callbacks or lose drafts on a rejected reset", async () => {
    api.completePasswordReset.mockResolvedValue({ success: false, message: "Expired" });
    const done = vi.fn();
    render(<ResetPasswordPanel token="token" onPasswordReset={done} />);
    passwordForm();
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Expired");
    expect(done).not.toHaveBeenCalled();
    expect((screen.getByLabelText("New password") as HTMLInputElement).value).toBe("StrongPassword1!");
  });
  it("prevents duplicate submission until completion", async () => {
    let resolve!: (value: { success: boolean }) => void;
    api.completePasswordReset.mockReturnValue(new Promise(value => { resolve = value; }));
    render(<ResetPasswordPanel token="token" />);
    passwordForm();
    const form = screen.getByLabelText("New password").closest("form")!;
    fireEvent.submit(form); fireEvent.submit(form);
    expect(api.completePasswordReset).toHaveBeenCalledTimes(1);
    await act(async () => resolve({ success: true }));
    expect(screen.queryByLabelText("New password")).toBeNull();
  });
  it("ignores completion of an old link after navigating to another token", async () => {
    let resolve!: (value: { success: boolean }) => void;
    api.completePasswordReset.mockReturnValue(new Promise(value => { resolve = value; }));
    const done = vi.fn();
    const view = render(<ResetPasswordPanel token="old" onPasswordReset={done} />);
    passwordForm(); fireEvent.click(screen.getByRole("button", { name: "Update password" }));
    view.rerender(<ResetPasswordPanel token="new" onPasswordReset={done} />);
    await act(async () => resolve({ success: true }));
    expect(done).not.toHaveBeenCalled();
    expect((screen.getByLabelText("New password") as HTMLInputElement).value).toBe("");
  });
  it("enforces configurable password complexity before any transport call", () => {
    render(<ResetPasswordPanel token="token" formProps={{ passwordRules: ["capital", "specialChar", "number", "match"] }} />);
    passwordForm("lowercaseonly");
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(api.completePasswordReset).not.toHaveBeenCalled();
  });
  it("requires matching passwords", () => {
    render(<ResetPasswordPanel token="token" />);
    passwordForm();
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "DifferentPassword1!" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));
    expect(screen.getByRole("alert").textContent).toContain("match");
    expect(api.completePasswordReset).not.toHaveBeenCalled();
  });
  it("changes an authenticated password through the shared account API", async () => {
    api.changePassword.mockResolvedValue({ success: true });
    render(<ChangePasswordPanel />);
    passwordForm();
    fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "OldPassword1!" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));
    await screen.findByRole("status");
    expect(api.changePassword).toHaveBeenCalledWith({ currentPassword: "OldPassword1!", newPassword: "StrongPassword1!" });
    expect(api.completePasswordReset).not.toHaveBeenCalled();
  });
  it("reports network failures without success", async () => {
    api.changePassword.mockRejectedValue(new Error("offline"));
    render(<ChangePasswordPanel />);
    passwordForm();
    fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "OldPassword1!" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));
    await screen.findByRole("alert");
    expect(screen.queryByRole("status")).toBeNull();
  });
});
describe("configurable workspace signup", () => {
  it("validates details before exposing credentials and preserves them when editing", async () => {
    const mapDetails = vi.fn(details => ({ fields: details }));
    render(<WorkspaceSignupPanel detailFields={[{ name: "workspace", label: "Workspace", required: true }, { name: "marketing", label: "Marketing", type: "checkbox" }]} mapDetails={mapDetails} />);
    fireEvent.submit(screen.getByRole("button", { name: "Continue" }).closest("form")!);
    expect(mapDetails).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Workspace"), { target: { value: "Team" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(JSON.parse(screen.getByTestId("signup-props").textContent!).fields.workspace).toBe("Team");
    fireEvent.click(screen.getByRole("button", { name: "Edit account details" }));
    expect((screen.getByLabelText("Workspace") as HTMLInputElement).value).toBe("Team");
    expect((screen.getByLabelText("Marketing") as HTMLInputElement).checked).toBe(false);
  });
});
