# Commerce Organization bridge and Media credentials

Updated 2026-11-05. These SSO changes are explicitly approved for Marketplace/Restaurant. Application genericOAuth remains unchanged.

SSO owns organization/member/team/teamMember/invitation. The bearer /auth/commerce/organization/[operation] endpoint is a Gorth extension, not a stock Organization bearer API. It uses Better Auth OAuth verification, validates the live client/resource binding and read/write scopes, resolves the issuing subject's live SSO session and calls native OAuth UserInfo for grant revocation. Only in-process AsyncLocalStorage supplies the native API session. No synthetic cookies or browser-supplied session context are accepted.

The operation allowlist covers organization list/create/update/leave; team list/create/update/remove; member list/role/remove; team-member list/add/remove; invitation create/list/cancel/accept/reject and personal invitations. Strict input prevents arbitrary auth.api dispatch or creating organizations on behalf of a caller-selected user.

Organization owner/admin can read every branch roster without assignment. A team manager remains an organization member and cannot create teams, invite or remove organization members. The team-role extension permits only lower roles within the manager's own team, excluding self-escalation and manager assignment/replacement. Team-role changes have a transactional audit entry; additional business audit coverage for every native operation is not claimed.

The initial confidential Media registration is a disabled draft. The admin credential action:
- Requires an authenticated authorized admin, CSRF protection and a managed confidential client.
- Uses native rotateClientSecret for an initialized client.
- Serializes draft initialization, registers through native adminCreateOAuthClient with the persisted resources/scopes, keeps the result disabled and deletes the unused draft. Failed setup attempts compensate the new registration and release the claim.
- Lets the provider generate/hash credentials. Initial provisioning changes client ID; later rotation preserves it.
- Returns ID/secret once through a no-store response and UI. No secret is written to files/logs/chat. Enable the client only after configuring Media.
- Adds a storageCredentialReader marker so rerunning the registry script recognizes the native registration rather than creating another draft.

Cloud revision 2 adds restaurant scopes; revision 3 adds the two storage scopes. Approved resources/client bindings are registered. Deploy SSO with NEXT_OAUTH_SCOPE_REVISION=3 and sign in again in the applications. Production identifiers must use their real HTTPS URLs. No wildcard client/resource access is introduced.

Verification: six targeted suites pass 43 tests, including signed-token verification, real memory-adapter Organization/OAuth Provider behavior and controlled database boundaries. SSO TypeScript passes. The complete suite run before four additional manager cases reports 348 passing / 8 failing: six app-resource-contract fixtures, one Orbit color and one storage-credential 403/401 case. Out-of-scope policies were not changed to hide those failures.

See the [Marketplace report](../../online-marketplace-solution/docs/ecosystem-organization-integration.en.md) for cloud migrations, operator steps, storage setup and acceptance limits.
References: [Organization](https://better-auth.com/docs/plugins/organization), [Generic OAuth](https://better-auth.com/docs/plugins/generic-oauth). Commerce object permissions and teamMember.role remain application-owned.
