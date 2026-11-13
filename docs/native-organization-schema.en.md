# Native Organization tables and event log

Cloud applied 2026-11-04; installed Better Auth **1.7.13**. Scope: SSO only. Applications, Commerce, dependencies and lockfiles were not modified.

Update 2026-11-13 (Better Auth 1.7.21): the physical table was renamed from `teamMember` to `team_member` on cloud using `database/migrations/20261113-team-member-snake-case.sql`. Only table/index names changed; foreign keys and rows were preserved (0 rows at preflight). `bun database/migrate-team-member.mjs --apply` verifies data fingerprints and supports retries. Historical sections below describe the earlier cutover; do not rerun that older migration alone after this rename.

Cloud verification: `bun --env-file=.env.local run test -- --config vitest.team-member.cloud.config.ts --configLoader native`. Bun loads the configured server environment into the process because Next skips .env.local under NODE_ENV=test; credentials are not printed.

November 13 results: migration committed on Neon; typecheck passed; 42 related tests and 6 cloud tests passed, including native multi-team/role Organization APIs and idempotent migration verification. Restart/deploy the updated SSO code to match the cloud table name.

| Previous | Current |
|---|---|
| Active `auth_team` | `team` |
| `auth_team_member` → `teamMember` on November 4 | `team_member` since November 13 |
| Legacy `team`, `team_member` | Removed after confirming both were empty |
| `authentication_event` | `event_log` |
| `authentication_event_type_enum` | `event_log_type_enum` |
| `invitation.team_id` UUID with single-team FK | Nullable TEXT supporting native multiple-team invitations |

The native Better Auth model key `betterAuthSchema.teamMember` is unchanged; its Drizzle object now targets the physical `team_member` table. `team` still targets `team`. No plugin `modelName` or fields changed. Authorization/notification SQL and current cloud fixtures now use `team_member`.

The application extension `teamMember.role`, its default/member-role constraint and Commerce authorization behavior remain. Queries, cloud fixtures and relations use the new tables. Single-team invitation relations were removed because the native value may contain multiple IDs. Existing `role`, `permission`, `member_role` and `role_permission` tables remain; they are not automatically Better Auth Dynamic Access Control.

No issuer, signing key, secret, cookie, login session or application OAuth flow was changed. Native Organization 1.7.13 serializes invitation team IDs with `join(",")` and parses them during acceptance. TEXT follows that contract; native APIs continue to validate team/organization access.

## Migration

`database/migrations/20261104-native-organization.sql` is applied through:

```sh
# Rehearsal, rollback by default
bun database/migrate-native-organization.mjs
# Applied cloud cutover
bun database/migrate-native-organization.mjs --apply
```

The runner uses a REPEATABLE READ transaction, advisory lock, lock timeout, before/after target record fingerprints and checks of unrelated schema/public-table data. There is no DROP CASCADE. Nonempty legacy tables or unexpected dependencies abort rather than silently discarding data or transferring authority. Native records retain IDs and contents; existing single-team invitation values survive UUID-to-TEXT conversion.

Cloud preflight found zero records in all four team tables, invitation and authentication_event. The migration committed and reruns safely. The historical team-role runner detects the normalized schema and does not recreate retired tables. Earlier SQL migration history remains immutable; do not replay individual historical migrations after cutover. Source and cloud now have **27 declared tables**, down from 29.

## Evidence

- **3 pre-cutover migration cloud tests passed**: populated native data preservation, nonempty legacy refusal and unexpected-FK rollback. All fixtures rolled back. This suite skips against an already migrated database.
- **11 post-cutover cloud tests passed**: 5 real native Organization/event-log scenarios and 6 Commerce authority regressions. Native Better Auth + Drizzle + PostgreSQL exercised create org/team, multi-team invite, acceptance, membership keys/default role and active session context. Only test-owned fixtures were cleaned up.
- **28 related schema/authority/bearer/plugin tests passed**; TypeScript passed.
- Full SSO Vitest: **334 passed / 8 failed**, 56 files. Existing unrelated failure groups remain: six app resource contracts, one GorCer orbit color and one storage-credential 401-versus-403 assertion. Those policies/UI areas were not changed to make tests pass.

```sh
# Run before cutover or against a pre-migration database snapshot
NODE_ENV=development bun run test -- --config vitest.migration-cloud.config.ts
# Post-cutover regression
NODE_ENV=development bun run test -- --config vitest.commerce-cloud.config.ts
bun run typecheck
```

**Deploy/restart SSO with this source** so runtime queries use the new table names. Database application does not automatically deploy the server. Application genericOAuth flows remain unchanged. OAuth-client enum expansion was outside this request.

References: [Organization](https://better-auth.com/docs/plugins/organization), [Database](https://better-auth.com/docs/concepts/database).
