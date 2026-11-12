import { describe, expect, it } from "vitest";
import { invitationLifecycleActions } from "../invitationLifecycle";
import type { InvitationListItem, InvitationStatus } from "../types/invitations";
const row = (status: InvitationStatus, expired = false): InvitationListItem => ({
  id: "opaque", firstName: "Test", lastName: "Invite", email: "test@example.test", status,
  expiryDate: expired ? "2020-01-01" : "2099-01-01", canResend: true, canCancel: true,
  canArchive: true, canRemove: true, canCopyLink: true
});
describe("shared invitation lifecycle", () => {
  it.each(["accepted", "declined", "revoked", "cancelled"] as InvitationStatus[])("archives %s without cancellation", status => {
    expect(invitationLifecycleActions(row(status))).toMatchObject({ canArchive: true, canRemove: true, canCancel: false, canCopyLink: false });
  });
  it("never resends an accepted invitation", () => expect(invitationLifecycleActions(row("accepted")).canResend).toBe(false));
  it("requires cancellation before archiving a live pending invitation", () => expect(invitationLifecycleActions(row("pending"))).toMatchObject({canCancel: true, canArchive: false, canRemove: false}));
  it("allows history archival when a pending invitation has expired", () => expect(invitationLifecycleActions(row("pending", true))).toMatchObject({canArchive: true, canCopyLink: false}));
  it("denies unknown states", () => expect(Object.values(invitationLifecycleActions(row("unknown"))).every(value => !value)).toBe(true));
  it("never widens the server capabilities", () => expect(Object.values(invitationLifecycleActions({...row("expired"), canResend: false, canCancel: false, canArchive: false, canRemove: false, canCopyLink: false})).every(value => !value)).toBe(true));
});
