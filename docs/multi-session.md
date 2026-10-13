# Multi-account SSO

Implementation follows Better Auth 1.7.7, imported only through the installed public `@gorth/structure` exports:

- [Multi Session](https://better-auth.com/docs/plugins/multi-session)
- [OAuth select-account screen](https://better-auth.com/docs/plugins/oauth-provider#select-account-screen)
- [Google account selection](https://better-auth.com/docs/authentication/google#always-ask-to-select-an-account)

## Storage and boundaries

The Hono server enables `multiSession()`; the Next.js client enables `multiSessionClient()`. The existing `user` and `session` tables remain unchanged. Better Auth keeps the browser's account slots in signed, HttpOnly cookies; no account-list table, localStorage registry, migration or cloud push is needed.

The default plugin limit is five device slots. Expired/revoked sessions are not displayed. Signing in to the same account replaces its previous slot on this browser rather than creating a duplicate account entry.

Next.js does not connect to the SSO database. `/auth/browser-account` reads native Better Auth endpoints and exposes only public account fields and a session ID. Account actions resolve that ID against the sessions authorized by the incoming signed cookies; the UI cannot submit an arbitrary session token. Mutations require the configured SSO client Origin, JSON input and a bounded 2 KiB body. Responses are no-store and preserve individual Set-Cookie headers.

## UI

- `/auth/select-account`: choose/continue with an account, add an account, sign out a selected account, or sign out all accounts on this browser.
- `/auth/add-account`: authenticate another account without automatically redirecting using the account already active. Google asks for account selection for this action.
- `/settings/browser-account`: the same controls inside SSO settings, linked from the settings sidebar.
- All SSO NavUser menus (Settings/Admin sidebar and navbar, and shared-page navbar) include **Switch account**. This action replaces the existing menu content with the account chooser in place, with **Back** to return and **Add another account** as the last item. Account rows reuse Primitive's `SidebarMenuButton`, `NavAvatar` and `NavName`: `h-14`, width 240px, avatar `size-9`, and the same name/email typography and hover classes as the dashboard NavUser; a trailing tick marks the active account. The app-local composition leaves the installed shared package unchanged. The chooser fetches a fresh browser-authorized list on entry. Switching waits for native set-active to succeed, then reloads `/settings` to discard account-scoped provider state and avoid retaining an Admin route for an account without that role. Adding an account uses `/auth/add-account` and returns to Settings. This menu does not change sessions in relying apps.

Default SSO header/sidebar logout and the logout button revoke only the active browser account. Better Auth selects a remaining valid slot if one exists. Other accounts and sessions on other devices remain intact. The explicitly labelled all-accounts action uses native `signOut()`, which removes this browser's device slots, not every session on every device. GET `/auth/sign-out` is non-mutating; POST validates the real Origin before forwarding it.

Pre-plugin sessions that lack a multi cookie remain visible. A legacy session can revoke itself via the native core endpoint and an authoritative session read clears its cookies; it never falls back to all-account sign-out. When only device slots remain and the active cookie is missing/expired, selected logout first recovers that verified slot via native set-active before native revoke.

At rollout, re-authenticate an existing pre-plugin account once before adding more accounts. The plugin creates its device slot on sign-in; this implementation does not manufacture native multi-cookie slots or infer browser membership from unrelated database sessions.

## OAuth

`oauthProvider.selectAccount` redirects to the chooser when more than one valid device account exists. Native `prompt=select_account` also displays it for a single account. Native `prompt=none` returns `account_selection_required` instead of interactive UI where selection is required.

Choosing an account sets the active session first, then calls `oauth2.continue({ selected: true, oauth_query })` with the unchanged signed query. Native verification of the signature, redirect URI, state, PKCE, scopes and consent remains enabled.

Credential entry on the add-account page uses a separate native SDK instance without `oauthProviderClient` auto-query injection. It retains multi-session and the same cookie/proxy settings. This prevents the credential request itself from completing OAuth before returning to the chooser; the signed query is retained in the same-origin callback. The main SDK keeps `oauthProviderClient` for explicit OAuth continuation and the existing normal login flows.

Switching SSO account does not silently switch the identity of an already logged-in application's local session. Session deletion continues through Better Auth's native adapter/hooks so existing OAuth back-channel logout behavior is retained. Delivery and local revocation at relying parties still depend on their registered callback and verification configuration. Offline-access grants follow the provider's native policy; account logout must not be described as revoking every delegated grant.

## Verification

From `client`, run `pnpm test`, `pnpm typecheck` and targeted ESLint checks. Vitest uses an isolated in-memory Better Auth server, real multi-session/OAuth plugins and browser cookie jars. It never imports application environment or database configuration and never creates production users.

Coverage includes account listing without bearer fields, switching, selected logout of active/inactive/last/legacy slots, recovery without an active cookie, all-browser logout preserving another device, duplicate-account login, Origin/CSRF, malformed/oversized input, unavailable SSO, signed OAuth continuation, tampering, PKCE code exchange and the selected ID-token `sub`. The add-account SDK is checked against the native in-memory handler.

Manual deployment acceptance: restart SSO client/server, log in with two real accounts, choose both through an app OAuth flow, then check selected/all-browser logout in a second browser/device. Google/OTP and registered-app back-channel delivery require real configured providers and are not asserted by the isolated fixture tests.
