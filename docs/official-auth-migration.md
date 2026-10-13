# Official auth migration — 2026-10-11

SSO imports Better Auth and the OAuth Provider, SSO and Infrastructure plugins
directly from official packages. No independent authorization-code, token,
JWKS, refresh or session engine is added.

Next's auth catch-all passes the original Request to Hono and auth.handler.
The old forwarding/header-copy/JSON-redirect bridge has been removed. Native
Set-Cookie and protocol responses are preserved.

The official Username plugin replaces hand-written username validation. It uses
the existing username column with the configured 5–32 lowercase ASCII policy,
without introducing a display-username column. Existing user/session IDs and
signing secrets remain unchanged.

## Email or username sign-in

The sign-in and add-account forms accept one email-or-username field. They call
the native `signIn.email()` or `signIn.username()` SDK method respectively;
the application never looks up an email from a username or verifies passwords.
Both clients use `usernameClient({ displayUsername: false })`, matching the
server's schema. `false` omits the separate non-normalized display username;
it does not disable username sign-in or affect the user's display `name`.

Registration and profile editing call `isUsernameAvailable()` with a 500 ms
debounce, cancel stale validation and skip the current profile's unchanged name.
Better Auth still enforces availability on sign-up/update; preflight is only UI
feedback, not a uniqueness guarantee. Database uniqueness remains unchanged.

An unverified username sign-in returns Better Auth's `EMAIL_NOT_VERIFIED` error
without an email address. The UI asks the user to sign in with email to continue
the existing email-OTP flow; no public username-to-email endpoint is introduced.
All these changes are confined to SSO; relying-party apps keep OAuth sign-in.

OAuth account-token encryption uses Better Auth's built-in option, including
support for reading existing plaintext records. General SDK session reads use
native cookie caching (120 seconds), without a 30-second poll or forced bypass.
Protected server guards still use disableCookieCache: true. Multi-session,
account chooser, email OTP, organizations, admin and existing plugins remain.

The official custom-claim extension supplies profile claims in verified ID
tokens so Generic OAuth consumers do not need another UserInfo call at login.
Reserved issuer/audience/subject/protocol claims cannot be replaced.

Only the Browser/Launcher Website callback paths were changed in the cloud
OAuth registry to /auth/callback/gorth. No secrets, scopes, issuer, other clients
or SSO schema were changed. Website sign-out stays local and does not call
SSO end-session.

The 120-second idle OAuth cancellation remains application UI behavior.
Better Auth still signs and validates the authorization query. CIMD is not
enabled for fixed first-party clients; no new identity authority/password signup
is introduced in the relying-party websites.

Vitest covers native OAuth selection, sessions/multi-session, CSRF, guards,
metadata and the Hono boundary. Relying-party tests live in each website.
Real-account UI acceptance remains a user-operated check.

References: [OAuth Provider](https://better-auth.com/docs/plugins/oauth-provider),
[Username](https://better-auth.com/docs/plugins/username),
[Hono](https://better-auth.com/docs/integrations/hono),
[Next.js](https://better-auth.com/docs/integrations/next).
