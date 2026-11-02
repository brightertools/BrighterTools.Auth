# Workspace invitation presentation

The shared InvitationManagementPanel owns the MyRipple-inspired list/form presentation.
Hosts provide API adapters, localized labels, allowed roles and policy descriptions.
No tenant lifecycle, identifiers, quotas, branding or MyRipple fund rules are copied.

Opt in with presentation="workspace" and import
@brightertools/auth-react/styles/invitations.css.

The default presentation remains "tabs". The stylesheet is scoped to the opted-in
component and does not import Bootstrap. Hosts compile Bootstrap once as before.
No MyRipple application page has been automatically replaced.

Workspace mode provides a count/header and primary invite action, focused form,
responsive role-description area, separate actions, comfortable list, status badges
and pagination. RoleOption.description supplies reusable role guidance.
inviteHelpContent and roleHelpContent accept host policy content; the layout owns
its arrangement. sectionLabel supplies the localized section kicker.

showImport, showMessage, showCanChangeEmailAddress, defaultCanChangeEmailAddress
and roleOptions remain host-controlled. showInvitationDate defaults true; hosts
without invitation creation dates can hide it rather than invent dates. Capability
flags still control resend, revoke, details, copy and removal.

The form retains entered values on rejection, prevents concurrent submission,
uses unique labelled checkbox IDs and focuses the first field on entry and the
invite action on return in workspace mode. The shared adapter remains responsible
for server errors; authorization is always server-owned.

Brand tokens (all optional; default to Bootstrap light/dark variables):
- --bt-invitation-surface
- --bt-invitation-subtle
- --bt-invitation-muted
- --bt-invitation-border
- --bt-invitation-accent-soft

MediaMarkup consumes the shared layout with only semantic brand-token mapping.
It disables bulk import, custom messages, copying token URLs and destructive
history deletion; recipient matching remains required by default. The tenant
identity keys the panel so switching workspaces discards old form/list state.

Local-source addition only. No version bump, publication, deployment or email
delivery is included. MyRipple migration to this component can be a separate
reviewed adoption retaining its backend contracts and supported capabilities.
