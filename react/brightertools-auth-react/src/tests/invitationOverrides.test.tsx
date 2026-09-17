import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InvitationAcceptancePanel } from "../components/InvitationAcceptancePanel";

const adapterFor = (canChangeEmailAddress = false) => ({
  getInvitationDetails: vi.fn().mockResolvedValue({
    success: true, data: { email: "invited@example.com", accountName: "Example", status: "pending", canChangeEmailAddress }
  }),
  acceptInvitation: vi.fn(),
  connectInvitation: vi.fn().mockResolvedValue({ success: true }),
  declineInvitation: vi.fn().mockResolvedValue({ success: true })
});

describe("invitation compatibility and overrides", () => {
  it.each([undefined, "", "   "])("does not infer a mismatch from missing email %s", async email => {
    const adapter = adapterFor();
    adapter.connectInvitation.mockResolvedValue({ success: false, message: "Host rejected invitation" });
    render(<InvitationAcceptancePanel invitationKey="key" adapter={adapter} currentUser={{}}
      getCurrentUserEmail={email === undefined ? undefined : () => email} />);
    expect(await screen.findByText("You are already signed in.")).not.toBeNull();
    expect(screen.queryByText(/Uniiite/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Accept invitation with this account" }));
    await screen.findByText("Host rejected invitation");
    expect(adapter.connectInvitation).toHaveBeenCalledWith({ userInvitationKey: "key" });
  });

  it("retains the body override while loading and after loading and uses custom actions", async () => {
    const adapter = adapterFor();
    const { container } = render(<InvitationAcceptancePanel invitationKey="key" adapter={adapter}
      currentUser={{}} getCurrentUserEmail={() => " INVITED@EXAMPLE.COM "}
      classNames={{ body: "host-body" }}
      textOverrides={{ invitationAcceptance: {
        currentAccountIntroMessage: "Host welcome", useCurrentAccountLabel: "Host connect",
        useAnotherAccountLabel: "Host switch", currentUserFallbackLabel: "Host user",
        loginProviderFallbackLabel: "Host provider"
      } }} />);
    expect(container.querySelector(".host-body")?.textContent).toContain("Loading");
    await screen.findByText("Host welcome");
    expect(container.querySelector(".host-body")?.textContent).toContain("Host welcome");
    expect(screen.getByText(/INVITED@EXAMPLE.COM.*Host provider/)).not.toBeNull();
    expect(screen.getByRole("button", { name: "Host switch" })).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Host connect" }));
    await waitFor(() => expect(adapter.connectInvitation).toHaveBeenCalledOnce());
  });

  it("localizes the explicit decline message without sending it until confirmed", async () => {
    const adapter = adapterFor();
    render(<InvitationAcceptancePanel invitationKey="key" adapter={adapter} currentUser={{}}
      getCurrentUserEmail={() => "different@example.com"}
      textOverrides={{ invitationAcceptance: { requestInvitationUpdateMessage: "Invite {email} instead" } }} />);
    fireEvent.click(await screen.findByRole("button", { name: "Decline invitation and request an update" }));
    expect((screen.getByLabelText("Message to the inviter (optional)") as HTMLTextAreaElement).value)
      .toBe("Invite different@example.com instead");
    expect(adapter.declineInvitation).not.toHaveBeenCalled();
  });

  it("localizes the signed-out choices and create-account actions", async () => {
    render(<InvitationAcceptancePanel invitationKey="key" adapter={adapterFor(true)}
      textOverrides={{ invitationAcceptance: {
        accountChoiceHeading: "Choose", accountChoiceDescription: "Host choice",
        existingAccountHeading: "Existing", createNewAccountInsteadLabel: "New",
        alreadyHaveAccountLabel: "Back to existing", acceptInvitationLabel: "Host accept"
      } }} />);
    await screen.findByText("Choose");
    expect(screen.getByText("Host choice")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Existing" })).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "New" }));
    expect(screen.getByRole("button", { name: "Back to existing" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Host accept" })).not.toBeNull();
  });
});
