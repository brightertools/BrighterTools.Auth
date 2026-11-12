import type { InvitationListItem } from "./types/invitations";

/** Reduce host capabilities to valid lifecycle actions; never grant a permission absent from the host. */
export function invitationLifecycleActions(item: InvitationListItem, now = Date.now()) {
  const expired = !!item.expiryDate && Date.parse(item.expiryDate) <= now;
  const pending = item.status === "pending";
  const known = ["pending", "accepted", "declined", "expired", "revoked", "cancelled"].includes(item.status);
  const history = known && (!pending || expired);
  const unconsumed = pending || item.status === "expired";
  return {
    canResend: known && item.status !== "accepted" && item.canResend === true,
    canCancel: unconsumed && item.canCancel === true,
    canArchive: history && item.canArchive === true,
    canRemove: history && item.canRemove === true,
    canCopyLink: pending && !expired && item.canCopyLink === true
  };
}
