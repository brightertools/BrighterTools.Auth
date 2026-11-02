import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { InvitationManagementPanel } from "../components/InvitationManagementPanel";

afterEach(cleanup);
const adapter = () => ({
  getInvitationList: vi.fn().mockResolvedValue({ success: true, data: { items: [], totalCount: 0 } }),
  inviteUser: vi.fn().mockResolvedValue({ success: true }),
  importInvitations: vi.fn()
});

it("opts into focused list/form layout without changing default tabs", async () => {
  const api = adapter();
  const { container } = render(<InvitationManagementPanel adapter={api} presentation="workspace"
    sectionLabel="Workspace access" showImport={false} showInvitationDate={false}
    roleOptions={[{ value: "member", label: "Member", description: "Workspace access only." }]} />);
  await screen.findByText("Workspace access");
  expect(container.querySelector('[data-presentation="workspace"][data-view="list"]')).not.toBeNull();
  expect(screen.queryByRole("button", { name: "List", exact: true })).toBeNull();
  expect(screen.queryByRole("columnheader", { name: "Invitation Date" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Invite User" }));
  expect(screen.getByText("Workspace access only.")).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByLabelText("First Name"));
  expect(screen.queryByRole("table")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Cancel", exact: true }));
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Invite User" }));
  expect(api.inviteUser).not.toHaveBeenCalled();
});

it("prevents duplicate sends and retains entered values on server rejection", async () => {
  const api = adapter();
  let complete!: (value: { success: boolean; message: string }) => void;
  api.inviteUser.mockImplementation(() => new Promise(resolve => { complete = resolve; }));
  render(<InvitationManagementPanel adapter={api} presentation="workspace" showImport={false} defaultCanChangeEmailAddress={false} />);
  fireEvent.click(screen.getByRole("button", { name: "Invite User" }));
  fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Alex" } });
  fireEvent.change(screen.getByLabelText("Last Name"), { target: { value: "Example" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "alex@example.test" } });
  const send = screen.getByRole("button", { name: "Send Invitation" });
  fireEvent.click(send); fireEvent.click(send);
  expect((send as HTMLButtonElement).disabled).toBe(true);
  expect(api.inviteUser).toHaveBeenCalledTimes(1);
  complete({ success: false, message: "Administrator quota reached." });
  await screen.findByText("Administrator quota reached.");
  expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("alex@example.test");
  expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(false);
  await waitFor(() => expect((screen.getByRole("button", { name: "Send Invitation" }) as HTMLButtonElement).disabled).toBe(false));
});

it("uses unique labelled email-policy controls for multiple instances", () => {
  render(<><InvitationManagementPanel adapter={adapter()} /><InvitationManagementPanel adapter={adapter()} /></>);
  screen.getAllByRole("button", { name: "Invite User" }).forEach(button => fireEvent.click(button));
  const controls = screen.getAllByRole("checkbox");
  expect(controls[0].id).not.toBe(controls[1].id);
  expect(controls.every(control => (control as HTMLInputElement).labels?.length === 1)).toBe(true);
});

it("reports list-refresh failure separately after an invitation was sent", async () => {
  const api = adapter();
  api.getInvitationList.mockResolvedValueOnce({ success: true, data: { items: [], totalCount: 0 } })
    .mockRejectedValueOnce(new Error("Network unavailable"));
  render(<InvitationManagementPanel adapter={api} presentation="workspace" showImport={false}
    textOverrides={{ invitationManagement: { loadFailedMessage: "List unavailable.", inviteFailedMessage: "Send failed." } }} />);
  await screen.findByText("No invitations found.");
  fireEvent.click(screen.getByRole("button", { name: "Invite User" }));
  fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Alex" } });
  fireEvent.change(screen.getByLabelText("Last Name"), { target: { value: "Example" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "alex@example.test" } });
  fireEvent.click(screen.getByRole("button", { name: "Send Invitation" }));
  await screen.findByText("List unavailable.");
  expect(screen.queryByText("Send failed.")).toBeNull();
  expect(screen.queryByLabelText("Email")).toBeNull();
  expect(api.inviteUser).toHaveBeenCalledTimes(1);
});