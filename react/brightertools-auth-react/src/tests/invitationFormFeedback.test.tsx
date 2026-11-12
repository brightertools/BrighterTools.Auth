import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { InvitationManagementPanel } from "../components/InvitationManagementPanel.js";
import { InvitationAcceptancePanel } from "../components/InvitationAcceptancePanel.js";

const managementAdapter = () => ({
  getInvitationList: vi.fn().mockResolvedValue({ success: true, data: { items: [], totalCount: 0 } }),
  inviteUser: vi.fn().mockResolvedValue({ success: true, messages: ["User invited successfully."] }),
  importInvitations: vi.fn()
});
async function sendInvitation() {
  await screen.findByText("No invitations found.");
  fireEvent.click(screen.getByRole("button", { name: "Invite User" }));
  fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Alex" } });
  fireEvent.change(screen.getByLabelText("Last Name"), { target: { value: "Example" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "alex@example.test" } });
  fireEvent.click(screen.getByRole("button", { name: "Send Invitation" }));
  await screen.findByText("User invited successfully.");
  await waitFor(() => expect((screen.getByRole("button", { name: "Invite User" }) as HTMLButtonElement).disabled).toBe(false));
}
it.each(["tabs", "workspace"] as const)("clears the previous success when starting another invitation (%s)", async presentation => {
  const api = managementAdapter();
  render(<InvitationManagementPanel adapter={api} presentation={presentation} showImport />);
  await sendInvitation();
  fireEvent.click(screen.getByRole("button", { name: "Invite User" }));
  expect(screen.queryByText("User invited successfully.")).toBeNull();
  expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("");
  expect(api.inviteUser).toHaveBeenCalledTimes(1);
});
it("clears feedback on host-controlled navigation to a fresh invitation", async () => {
  const api = managementAdapter();
  const view = render(<InvitationManagementPanel adapter={api} presentation="workspace" view={{ mode: "list" }} />);
  await sendInvitation();
  view.rerender(<InvitationManagementPanel adapter={api} presentation="workspace" view={{ mode: "import" }} />);
  expect(screen.queryByText("User invited successfully.")).toBeNull();
  view.rerender(<InvitationManagementPanel adapter={api} presentation="workspace" view={{ mode: "invite" }} />);
  expect(screen.queryByText("User invited successfully.")).toBeNull();
  expect((screen.getByLabelText("First Name") as HTMLInputElement).value).toBe("");
});
const acceptanceAdapter = () => ({
  getInvitationDetails: vi.fn().mockResolvedValue({ success: true, data: {
    email: "invitee@example.test", firstName: "Invited", lastName: "User", status: "pending"
  } }),
  acceptInvitation: vi.fn(), connectInvitation: vi.fn(), declineInvitation: vi.fn()
});
it("reveals and hides each new-account password independently without submitting", async () => {
  const api = acceptanceAdapter();
  render(<InvitationAcceptancePanel invitationKey="fixture" adapter={api} />);
  fireEvent.click(await screen.findByRole("button", { name: "Create a new account and accept invitation" }));
  const password = screen.getByLabelText("Password") as HTMLInputElement;
  const confirmation = screen.getByLabelText("Confirm Password") as HTMLInputElement;
  fireEvent.change(password, { target: { value: "Password1!" } });
  fireEvent.change(confirmation, { target: { value: "Password1!" } });
  for (const input of [password, confirmation]) {
    expect(input.type).toBe("password");
    expect(input.autocomplete).toBe("new-password");
    fireEvent.click(within(input.parentElement!).getByRole("button", { name: "Show password" }));
    expect(input.type).toBe("text");
    expect(input.value).toBe("Password1!");
    const hide = within(input.parentElement!).getByRole("button", { name: "Hide password" });
    expect(hide.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(hide);
    expect(input.type).toBe("password");
  }
  expect(api.acceptInvitation).not.toHaveBeenCalled();
  expect(api.connectInvitation).not.toHaveBeenCalled();
});
it("also uses the shared reveal control for the existing-account password fallback", async () => {
  const api = acceptanceAdapter();
  render(<InvitationAcceptancePanel invitationKey="fixture" adapter={api} />);
  fireEvent.click(await screen.findByRole("button", { name: "Accept invitation with existing account" }));
  const input = screen.getByLabelText("Password") as HTMLInputElement;
  expect(input.autocomplete).toBe("current-password");
  fireEvent.click(screen.getByRole("button", { name: "Show password" }));
  expect(input.type).toBe("text");
  expect(api.connectInvitation).not.toHaveBeenCalled();
});
