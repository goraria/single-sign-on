import type { BetterAuthPlugin } from "better-auth"
import {
  APIError,
  createAuthMiddleware,
  getAuthoritativeSessionFromCtx,
} from "better-auth/api"
import {
  newAuditRequestId,
  recordAdminAudit,
  type AdminAuditOperation,
} from "@/services/audit"

interface AuditContext {
  gorthAdminAudit?: AdminAuditOperation
}

function isNativeAdminMutation(context: {
  path?: string
  method?: string
  request?: Request
}) {
  if (
    !context.request ||
    ["GET", "HEAD", "OPTIONS"].includes(context.request.method)
  )
    return false
  return Boolean(
    context.path?.startsWith("/admin/") ||
    [
      "/oauth2/create-client",
      "/oauth2/update-client",
      "/oauth2/delete-client",
      "/oauth2/rotate-client-secret",
    ].includes(context.path ?? "")
  )
}

// Native HTTP admin endpoints must not bypass auditing by skipping our gateway.
// Internal auth.api calls have no Request; their owning gateway logs the outer operation.
export function adminAudit(): BetterAuthPlugin {
  return {
    id: "gorth-admin-audit",
    hooks: {
      before: [
        {
          matcher: isNativeAdminMutation,
          handler: createAuthMiddleware(async (ctx) => {
            delete (ctx.context as typeof ctx.context & AuditContext)
              .gorthAdminAudit
            const verified = await getAuthoritativeSessionFromCtx(ctx)
            if (!verified) return
            const body = ctx.body as Record<string, unknown> | undefined
            const id = body?.userId ?? body?.id ?? body?.client_id
            const operation: AdminAuditOperation = {
              actor: {
                id: verified.user.id,
                name: verified.user.name,
                email: verified.user.email,
              },
              action:
                `auth-admin.${ctx.request?.method.toLowerCase()}.${ctx.path?.startsWith("/admin/oauth2/resources") ? "resource" : ctx.path?.split("/").at(-1)}`.slice(
                  0,
                  128
                ),
              resourceType: "auth-admin",
              resourceId:
                typeof id === "string" &&
                /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,255}$/.test(id)
                  ? id
                  : null,
              requestId: newAuditRequestId(),
            }
            try {
              await recordAdminAudit(operation, "success", "requested")
            } catch {
              throw new APIError("SERVICE_UNAVAILABLE", {
                message: "audit_storage_unavailable",
              })
            }
            ;(
              ctx.context as typeof ctx.context & AuditContext
            ).gorthAdminAudit = operation
          }),
        },
      ],
      after: [
        {
          matcher: isNativeAdminMutation,
          handler: createAuthMiddleware(async (ctx) => {
            const operation = (ctx.context as typeof ctx.context & AuditContext)
              .gorthAdminAudit
            if (!operation) return
            const result = ctx.context.returned
            const status =
              result instanceof APIError
                ? result.statusCode
                : result instanceof Response
                  ? result.status
                  : 200
            if (
              status < 400 &&
              !operation.resourceId &&
              result &&
              typeof result === "object"
            ) {
              const response = result as {
                id?: unknown
                client_id?: unknown
                user?: { id?: unknown }
              }
              const id = response.id ?? response.client_id ?? response.user?.id
              if (
                typeof id === "string" &&
                /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,255}$/.test(id)
              )
                operation.resourceId = id
            }
            try {
              await recordAdminAudit(
                operation,
                status < 400 ? "success" : "failure",
                "completed",
                status
              )
            } catch {
              throw new APIError("SERVICE_UNAVAILABLE", {
                message: "audit_completion_failed_check_state_before_retry",
              })
            }
          }),
        },
      ],
    },
  }
}
