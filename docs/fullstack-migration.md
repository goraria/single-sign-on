# SSO fullstack

SSO now runs as one Next.js application, with Hono and Better Auth in the Node.js runtime. Start it from the repository root with `pnpm dev` (port 3000). There is no separate Vite/Hono server listening on port 8080.

## Active source

- `app/`: UI pages and thin Next route handlers. `app/api.ts` composes the Hono application; `app/(api)/[...path]/route.ts` dispatches its endpoints.
- `routes/`, `controllers/`, `middlewares/`, `services/`: backend source copied from the previous server.
- `services/client/`: frontend queries, mutations and browser-account operations, separated from backend services with overlapping names.
- `lib/auth/server/index.ts`: server-only Better Auth instance and its existing plugins.
- `lib/auth/client/index.ts`: browser SDK, including multi-session and OAuth provider clients.
- `lib/hono.ts`: reusable in-process Hono dispatcher. This does not send an HTTP request to the app itself.
- `database/`: the existing schema, migration history, registry seeds and administrative utilities. No cloud schema changes or registry seeding were performed during this migration.
- `utils/environment.ts`: the only application module reading environment variables. Client/server helper files are preserved in `utils/client/` and `utils/server/` to avoid filename collisions.
- `pkg/`: untouched archived client/server source. Excluded from TypeScript, ESLint, Vitest and Tailwind source scanning.

Native `/auth/*` requests go through Hono to `auth.handler(request)`. Server-rendered session reads call `auth.api.getSession()` directly. The account-list adapter calls the same local provider and never returns device-session bearer tokens to the UI. The existing `/admin/gateway/*` API URLs dispatch locally to the protected Hono admin routes, avoiding conflicts with `/admin/*` UI pages.

## Environment and rollout

Configure root `.env.local` using [.env.example](../.env.example). Private env files were not opened, copied or rewritten.

- Set `NEXT_PUBLIC_APP_URL` to the public SSO origin (local: `http://localhost:3000`).
- Preserve the exact existing `BETTER_AUTH_URL`, database, `BETTER_AUTH_SECRET`, and `GORTH_COOKIE_PREFIX`. SSO uses a single Better Auth secret through the SDK's default environment loading. Replacing it can invalidate sessions, encrypted signing keys, cookies or issuer validation. Deployment environments must also omit the SDK's optional versioned-secret setting.
- Server-specific `VITE_*` variables are no longer used. `VITE_AUTH_SECRET` becomes `NEXT_AUTH_SECRET`; Supabase public settings use `NEXT_PUBLIC_SUPABASE_*`. SMTP, Google, database and Better Auth variables retain their provider-owned names.
- Preserve the old access/refresh signing secrets only if the legacy internal token verification endpoints are still used. Normal OAuth/OIDC continues using the persisted signing keys.
- Configure SMTP before testing email signup/OTP. Google login requires its existing client ID and secret.
- Apps/services previously calling the private SSO origin at `http://localhost:8080` must point their server-side SSO URL to this fullstack deployment (`http://localhost:3000` locally). This is an upstream transport change, not an issuer, audience or OAuth client-registration change. Other app repositories were not rewritten in this task.

Do not run seed scripts automatically at startup or reset the DB. Drizzle commands load root env with `@next/env`; the existing schema is unchanged. Existing standalone administrative seed utilities require their environment to be loaded explicitly before importing `database`.

## Security and compatibility

Better Auth continues to own native endpoint origin/CSRF validation, cookies, sessions, multi-session, PKCE, signed OAuth continuation and token issuance. Hono retains persistent rate limiting for custom endpoints, body limits, exact-origin CORS and admin permission checks. The Next navigation proxy only checks cookie presence optimistically; it is not an authorization boundary.

Native `Set-Cookie` values are returned without stripping security attributes. The provider's public `/auth`, discovery and JWKS paths are preserved. Request initialization resolves registered client origins from the DB; module initialization uses only the configured SSO origin so importing auth during a build does not query the DB. OAuth URLs, tokens and signed queries are not logged by Hono's generic logger.

## Verification

`pnpm typecheck`, `pnpm lint`, and `pnpm test` check the root project. Tests use isolated Better Auth memory fixtures, not cloud credentials. They cover account selection, switching, account/browser-only logout, OAuth continuation, timeout validation, local Hono dispatch, native cookies, origin rejection, discovery and unauthenticated admin rejection.

The default production build remains `next build` (Turbopack). In the agent environment its PostCSS subprocess cannot bind an internal IPC port (`Operation not permitted`). A separate `next build --webpack` diagnostic compiled successfully; this is not a substitute for a successful Turbopack build in the deployment environment. Run `pnpm build` and the live login/logout smoke tests after configuring root env on the target machine.

Implementation follows [Better Auth's Next.js integration](https://better-auth.com/docs/integrations/next) and the installed Better Auth 1.7.7 request-context behavior. No custom replacement auth protocol was introduced.
