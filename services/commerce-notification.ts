import "server-only"
import { sql } from "drizzle-orm"
import { database } from "@/database"
import { createServiceError } from "@/services/helper"
import { teamBusinessActions } from "@/schemas/commerce-access"
import type { CommerceRecipientQuery } from "@/schemas/commerce-notification"

export async function checkCommerceNotificationClient(clientId: string, application: string, audience: string) {
  const result = await database.execute(sql`
    SELECT c.client_id FROM oauth_client c
    JOIN oauth_client_resource cr ON cr.client_id=c.client_id
    JOIN oauth_resource r ON r.identifier=cr.resource_id
    WHERE c.client_id=${clientId} AND c.reference_id='sso-administration'
      AND NOT c.disabled AND NOT c.public AND c.metadata->>'purpose'='commerce-outbox'
      AND c.grant_types=ARRAY['client_credentials']::oauth_grant_type_enum[]
      AND ${application + ":notification:publish"}=ANY(c.client_credentials_scopes)
      AND r.identifier=${audience} AND NOT r.disabled
      AND (r.allowed_scopes IS NULL OR 'commerce:notification:recipient'=ANY(r.allowed_scopes))`)
  if (result.rows.length !== 1) throw createServiceError("commerce_notification_client_required", 403)
}

export async function getCommerceNotificationRecipients(input: CommerceRecipientQuery) {
  const result = await database.execute(sql`
    SELECT u.id,u.name,u.email,m.role AS org_role,tm.role AS team_role
    FROM member m JOIN "user" u ON u.id=m.user_id
    LEFT JOIN team t ON t.organization_id=m.organization_id
      ${input.teamId ? sql`AND t.id=${input.teamId}::uuid` : sql``}
    LEFT JOIN "teamMember" tm ON tm.team_id=t.id AND tm.user_id=m.user_id
    WHERE m.organization_id=${input.organizationId}::uuid
      AND u.status='active' AND u.deleted_at IS NULL
      AND (NOT u.banned OR (u.ban_expires IS NOT NULL AND u.ban_expires<=now()))
      ${input.teamId ? sql`AND EXISTS(SELECT 1 FROM team scope_team WHERE scope_team.id=${input.teamId}::uuid AND scope_team.organization_id=m.organization_id)` : sql``}
    ORDER BY u.id,t.id LIMIT 1001`)
  if (result.rows.length > 1000) throw createServiceError("commerce_recipient_limit", 503)
  const recipients = new Map<string, { subject: string; name: string; email: string }>()
  for (const raw of result.rows) {
    const row = raw as { id: string; name: string; email: string; org_role: string; team_role: string | null }
    const admin = row.org_role.split(",").some(role => ["owner", "admin"].includes(role.trim()))
    const actions = row.team_role ? teamBusinessActions[row.team_role] ?? [] : []
    const capability = input.capability === "loyalty" ? "order" : input.capability === "procurement" ? "inventory" : input.capability
    if (admin || actions.some(action => ["read", "manage", capability + ":read"].includes(action)))
      recipients.set(row.id, { subject: row.id, name: row.name, email: row.email })
  }
  return { recipients: [...recipients.values()] }
}
