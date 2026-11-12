# Shared invitation validation — 7 November 2026

The Uniiite consumer reported "Failed to send invitation" after entering
`mark+test` without a domain. InvitationManagementPanel already prevented the
request, but used the generic transport-failure message for every invalid form.

The shared component now reports missing first/last names, an invalid email or
invalid role separately, preserving the draft and preventing transport calls.
Four optional invitationManagement text overrides retain localization/customization.
Existing success, service error, resend, tenant-switch and pending-request handling
remain unchanged. Plus-addressing is supported. New tests cover invalid input and
correction/retry. Shared suite: 133 passed; package build passed. Uniiite regression
suite: 194 passed. Its existing local source reference consumes the rebuilt package.

Only Uniiite's hosted assets were deployed, verified in its live browser at 17:22
UTC. Other consumers must build/adopt normally; no npm package was published.
Unrelated dirty Auth changes were preserved. App-specific email queue recovery and
host invoiced capacity changes live in Uniiite, not this reusable UI package.
