# Gorth SSO

Next.js fullstack application with a Hono backend and Better Auth. The archived client/server source remains in `pkg` and is not part of the active application.

Configure root `.env.local` from `.env.example`, preserving the existing database, issuer, cookie prefix and authentication secrets. Then run:

```sh
pnpm install
pnpm dev
```

The UI and APIs run together at `http://localhost:3000`; no separate port 8080 server is required.

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

See [fullstack migration](docs/fullstack-migration.md) for the file structure, upstream URL changes and verification limitations.
