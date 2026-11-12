> 8 November, 19:52 UTC — local only, user explicitly says **do not deploy yet**.
> InvitationManagementPanel clears feedback on internal and host-controlled view
> changes, so a successful previous invite does not leak into a new form.
> InvitationAcceptancePanel reuses PasswordField for new/confirmation/existing
> passwords, including the show/hide icon, autocomplete and submitting state.
> Five new regression cases pass; full shared React153 and Uniiite222 pass, both
> local builds pass. No backend, DTO, policy, email, publication or deployment.
> Pre-edit copies/logs: sibling uniiite/.artifacts/invitation-ui-local-20261108.

> 8 November continuation: shared React `invitationHttpFailure` now normalizes
> 401/403/404/429 and bounded400/409/422validation contracts; unexpected errors retain
> a safe generic message and validated trace reference. Invitation mutations use it.
> React148 and .NET53 tests passed; consumer suites remain compatible. The repeated
> Uniiite cancellation failure was independently reproduced as overlapping host
> bodyless DELETE handlers, corrected in that host with real HTTP/SQL retry/seat/race
> acceptance. No shared identifier conversion or tenant-policy bypass was introduced.
> Uniiite deployed at17:31UTC; Mosaio/MediaMarkup not redeployed by this slice.
> Full evidence: sibling uniiite/Documentation/AdministrationPerformance-2026-11-08.md.
> Preserve local uncommitted changes on top of Windows acc13c0.

> Deployment continuation (7November21:07UTC): Uniiite and Mosaio are both updated;
> MediaMarkup remains source/test only. Mosaio's real HTTP rehearsal additionally
> corrected its host-specific anonymous notification persistence/queue-result handling,
> without changing shared Auth contracts or generic tenant guards. Details:
> sibling uniiite/Documentation/ServiceUpdate-2026-11-07.md.

# Cross-app invitation contract — 7 November 2026

Reconciled Windows commit acc13c0 by fast-forward; retained all Mac modified/untracked
files. No overlapping changed source files. Windows allowExistingAccountLogin remains
optional/default true; Uniiite, Mosaio and MediaMarkup retain existing-account login.

Shared InvitationLifecycle defines archive/cancel eligibility, not authorization.
Hosts authorize current actors and reload locked persistent state. Archiving accepted
history never removes membership or refunds consumed capacity. Live pending history
must first be cancelled; expired pending history may be archived; unknown states fail
closed. The React component reduces host capability flags using the same state rules.
It never grants a host permission. Existing removeInvitation remains a compatibility
contract; updated consumers use explicit archiveInvitation. Hosts preserve IDs, policy,
store transactions and receipt/audit data. SavedProfileSummary is reusable presentation;
the host decides whether a profile is complete and when editing is permitted.

Combined React145/.NET51 passed; declaration build passed. Three consumer full React
suites/builds: Uniiite208, Mosaio27, MediaMarkup156. Uniiite real HTTP/SQL23 checkpoints
include accepted-history archive/replay and membership preservation. Mosaio actual SQL
failure/retry/concurrency/outbox/archival checks passed, with fixture cleanup. See
/Users/redman/Development/uniiite/Documentation/SharedAuthAlignment-2026-11-07.md.

Uniiite hosted update is live. Mosaio/MediaMarkup source changes are not deployments.
Mac source changes remain uncommitted/unpublished. Preserve dirty work before syncing
back to Windows; HEAD acc13c0 alone does not contain these Mac additions.
