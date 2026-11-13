import "server-only"
import { sql } from "drizzle-orm"
import { database } from "@/database"
import { resolveCommerceClientApplication } from "@/utils/commerce-client-application"
import { createServiceError } from "@/services/helper"
import {
  teamBusinessActions,
  type commerceTeamRoleInput,
} from "@/schemas/commerce-access"
import type { z } from "@gorth-io/structure/cores/zod"
export async function getCommerceTeamUsers(ids: string[]) {
  if (!ids.length) return []
  const result = await database.execute(
    sql`SELECT id,name,email,image FROM "user" WHERE id IN (${sql.join(
      ids.map((id) => sql`${id}::uuid`),
      sql`, `
    )})`
  )
  return result.rows as Array<{
    id: string
    name: string
    email: string
    image: string | null
  }>
}
export async function getCommerceRegistration(
  resource: string,
  clientId: string
) {
  const r = await database.execute(
    sql`SELECT r.identifier,c.metadata,c.scopes,c.reference_id AS "referenceId" FROM oauth_resource r JOIN oauth_client_resource cr ON cr.resource_id=r.identifier JOIN oauth_client c ON c.client_id=cr.client_id WHERE r.identifier=${resource} AND r.metadata->>'application'='commerce' AND NOT r.disabled AND c.client_id=${clientId} AND NOT c.disabled`
  )
  if (r.rows.length !== 1)
    throw createServiceError("commerce_registration_required", 403)
  const application = resolveCommerceClientApplication(r.rows[0] as unknown as Parameters<typeof resolveCommerceClientApplication>[0])
  if (!application) throw createServiceError("commerce_client_required", 403)
  return application
}
export async function getCommerceAuthorization(
  subject: string,
  resource: string
) {
  const active = await database.execute(
    sql`SELECT id FROM "user" WHERE id=${subject}::uuid AND status='active' AND (NOT banned OR (ban_expires IS NOT NULL AND ban_expires<=now()))`
  )
  if (!active.rows.length) throw createServiceError("inactive_user", 403)
  const result = await database.execute(
    sql`SELECT m.organization_id,m.role org_role,t.id team_id,tm.role team_role FROM member m JOIN "user" u ON u.id=m.user_id AND u.status='active' AND (NOT u.banned OR (u.ban_expires IS NOT NULL AND u.ban_expires<=now())) LEFT JOIN team t ON t.organization_id=m.organization_id LEFT JOIN team_member tm ON tm.team_id=t.id AND tm.user_id=m.user_id WHERE m.user_id=${subject}::uuid ORDER BY m.organization_id,t.id LIMIT 1001`
  )
  if (result.rows.length > 1000)
    throw createServiceError("commerce_authorization_limit", 503)
  const details: Record<string, unknown>[] = [],
    adminOrgs = new Set<string>()
  for (const raw of result.rows) {
    const row = raw as {
      organization_id: string
      org_role: string
      team_id: string | null
      team_role: string | null
    }
    const admin = row.org_role
      .split(",")
      .some((role) => ["owner", "admin"].includes(role.trim()))
    if (admin && !adminOrgs.has(row.organization_id)) {
      adminOrgs.add(row.organization_id)
      details.push({
        type: "commerce",
        locations: [resource],
        organization_id: row.organization_id,
        actions: ["*"],
      })
    }
    if (row.team_id && (admin || row.team_role)) {
      const actions = admin
        ? ["manage"]
        : (teamBusinessActions[row.team_role!] ?? [])
      if (actions.length)
        details.push({
          type: "commerce",
          locations: [resource],
          organization_id: row.organization_id,
          team_id: row.team_id,
          actions,
        })
    }
  }
  return { subject, audience: resource, authorization_details: details }
}
export async function updateCommerceTeamRole(
  callerId: string,
  p: z.infer<typeof commerceTeamRoleInput>
) {
  return database.transaction(async (tx) => {
    const team = await tx.execute(
      sql`SELECT organization_id FROM team WHERE id=${p.teamId}::uuid FOR UPDATE`
    )
    const org = team.rows[0]?.organization_id
    if (typeof org !== "string") throw createServiceError("team_not_found", 404)
    const caller = await tx.execute(
      sql`SELECT m.role,tm.role team_role FROM member m JOIN "user" u ON u.id=m.user_id AND u.status='active' AND (NOT u.banned OR (u.ban_expires IS NOT NULL AND u.ban_expires<=now())) LEFT JOIN team_member tm ON tm.user_id=m.user_id AND tm.team_id=${p.teamId}::uuid WHERE m.organization_id=${org}::uuid AND m.user_id=${callerId}::uuid FOR SHARE OF m,u`
    )
    const role = caller.rows[0]
    const admin =
      typeof role?.role === "string" &&
      role.role
        .split(",")
        .some((value: string) => ["owner", "admin"].includes(value.trim()))
    if (!admin && role?.team_role !== "manager")
      throw createServiceError("team_permission_denied", 403)
    const target = await tx.execute(
      sql`SELECT tm.id,tm.role,m.role org_role FROM team_member tm JOIN member m ON m.organization_id=${org}::uuid AND m.user_id=tm.user_id WHERE tm.team_id=${p.teamId}::uuid AND tm.user_id=${p.userId}::uuid FOR UPDATE OF tm`
    )
    const old = target.rows[0]
    if (!old) throw createServiceError("team_member_not_found", 404)
    if (old.org_role !== "member")
      throw createServiceError("org_admin_requires_no_team_role", 409)
    if (
      !admin &&
      (callerId === p.userId || p.role === "manager" || old.role === "manager")
    )
      throw createServiceError("org_admin_required", 403)
    await tx.execute(
      sql`UPDATE team_member SET role=${p.role} WHERE id=${old.id}::uuid`
    )
    await tx.execute(
      sql`INSERT INTO audit_log(actor_user_id,action,outcome,resource_type,resource_id,metadata) VALUES(${callerId}::uuid,'commerce.team-role.update','success','team-member',${String(old.id)},${JSON.stringify({ teamId: p.teamId, userId: p.userId, previousRole: old.role, role: p.role })}::jsonb)`
    )
    return { teamId: p.teamId, userId: p.userId, role: p.role }
  })
}
