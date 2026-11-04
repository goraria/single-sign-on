import "server-only"
import { AsyncLocalStorage } from "node:async_hooks"
import type { BetterAuthPlugin, Session, User } from "better-auth"
import { createAuthMiddleware } from "better-auth/api"

interface Delegation {
  path: string
  session: { session: Session; user: User }
}
// Only a verified, in-process server call can set this context. No HTTP header,
// cookie or browser input can inject a session into a native plugin endpoint.
export const commerceOrganizationDelegation =
  new AsyncLocalStorage<Delegation>()
export function commerceOrganization(): BetterAuthPlugin {
  return {
    id: "commerce-organization-delegation",
    hooks: {
      before: [
        {
          matcher: (ctx) =>
            commerceOrganizationDelegation.getStore()?.path === ctx.path,
          handler: createAuthMiddleware(async () => {
            const delegation = commerceOrganizationDelegation.getStore()
            if (delegation)
              return { context: { context: { session: delegation.session } } }
          }),
        },
      ],
    },
  }
}
