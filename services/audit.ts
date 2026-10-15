import { randomUUID } from "node:crypto"
import { database } from "@/database"
import { auditLog } from "@/database/schema"
import { createServiceError } from "@/services/helper"

export interface AuditActor {
  id: string
  name?: string | null
  email?: string | null
}
export interface AdminAuditOperation {
  actor: AuditActor
  action: string
  resourceType: string
  resourceId?: string | null
  requestId: string
  subjectUserId?: string
  clientId?: string
}

// Intentionally accept no request body, cookie, token, error message or arbitrary metadata.
export async function recordAdminAudit(
  operation: AdminAuditOperation,
  outcome: "success" | "failure",
  phase: "requested" | "completed",
  status?: number
) {
  try {
    await database.insert(auditLog).values({
      actorUserId: operation.actor.id,
      action: operation.action,
      resourceType: operation.resourceType,
      resourceId: operation.resourceId ?? null,
      outcome,
      metadata: {
        actorName: operation.actor.name ?? null,
        actorEmail: operation.actor.email ?? null,
        requestId: operation.requestId,
        phase,
        ...(operation.subjectUserId
          ? { subjectUserId: operation.subjectUserId }
          : {}),
        ...(operation.clientId ? { clientId: operation.clientId } : {}),
        ...(status === undefined ? {} : { status }),
      },
    })
  } catch {
    throw createServiceError("audit_storage_unavailable", 503)
  }
}

export function newAuditRequestId() {
  return randomUUID()
}
