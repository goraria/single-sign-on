# Chat fullstack audience

The local Chat OAuth resource is now `http://localhost:3030`. The obsolete
`http://localhost:5050` resource was removed from the registry on 2026-10-11.
Chat's OAuth client ID, secret/capability, redirect URIs and SSO sessions were
not changed. The original six allowed scopes, resource policy and client link
were preserved; other application resources were untouched.

The database already contained a default, unconfigured 3030 resource. The
scoped transaction copied the existing Chat policy into that placeholder,
moved the Chat client link and removed only the 5050 row. No issued-token rows,
consents, users or central sessions were deleted or rewritten. Existing signed
tokens retain their original audience; the Chat app requires a new app login.

The maintained resource seed uses 3030, so reseeding will not recreate 5050.
`database/migrate-chat-audience.ts` is an explicit administrative CLI, not a
startup action. Its default invocation is read-only. It checks that only Chat
is linked and refuses unknown target policies instead of overwriting them.

From `server`:

```sh
pnpm exec tsx database/migrate-chat-audience.ts
# Explicitly authorized one-time write, normally not needed after this migration:
pnpm exec tsx database/migrate-chat-audience.ts --apply
```

Read-only postflight verified: 5050 absent, 3030 present, the original six scopes
retained, and exactly one Chat client link. Server TypeScript passed. The existing
server ESLint configuration ignores TypeScript, so that command is not evidence
of a successful source lint. Chat's tests/typecheck/lint and Turbopack build were
verified separately. Production audiences must remain their registered HTTPS
identifiers; this local migration does not change production registrations.
