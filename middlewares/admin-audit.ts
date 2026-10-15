import type { MiddlewareHandler } from "hono"
import {
  recordAdminAudit,
  newAuditRequestId,
  type AuditActor,
  type AdminAuditOperation,
} from "@/services/audit"

export function auditAdminMutation(
  resourceType: string,
  action?: string
): MiddlewareHandler {
  return async (context, next) => {
    const operation: AdminAuditOperation = {
      actor: context.get("adminActor") as AuditActor,
      action: action ?? `${resourceType}.${context.req.method.toLowerCase()}`,
      resourceType,
      resourceId: /^[0-9a-f-]{36}$/i.test(context.req.param("id") ?? "")
        ? context.req.param("id")
        : null,
      requestId: newAuditRequestId(),
    }
    // Durable intent before side effects. Never execute a mutation if this write fails.
    await recordAdminAudit(operation, "success", "requested")
    await next()
    const status = context.res.status
    if (status < 400) {
      const response = await context.res
        .clone()
        .json()
        .catch(() => null)
      const id = response?.data?.id
      if (
        !operation.resourceId &&
        typeof id === "string" &&
        /^[0-9a-f-]{36}$/i.test(id)
      )
        operation.resourceId = id
      const subjectUserId = response?.data?.userId
      if (
        typeof subjectUserId === "string" &&
        /^[0-9a-f-]{36}$/i.test(subjectUserId)
      )
        operation.subjectUserId = subjectUserId
      const clientId = response?.data?.clientId
      if (
        typeof clientId === "string" &&
        /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,255}$/.test(clientId)
      )
        operation.clientId = clientId
    }
    try {
      await recordAdminAudit(
        operation,
        status < 400 ? "success" : "failure",
        "completed",
        status
      )
    } catch {
      // Native Better Auth writes cannot share our SQL transaction. Do not imply rollback.
      context.res = context.json(
        {
          error: "audit_completion_failed",
          operationMayHaveCompleted: status < 400,
          message:
            "Check the current state before retrying. The audit intent was recorded.",
        },
        503
      )
    }
    context.header("Cache-Control", "no-store")
  }
}
