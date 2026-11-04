import "server-only"
import { sql } from "drizzle-orm"
import { APIError } from "better-auth"
import { database } from "@/database"
import { getAuth } from "@/lib/auth/server"
import { requireCommerceUser } from "@/lib/auth/server/commerce-access"
import { commerceOrganizationDelegation } from "@/lib/auth/server/commerce-organization"
import {
  getOrganizationOperation,
  commerceTeamMemberOutput,
} from "@/schemas/commerce-organization"
import { commerceTeamRoleInput } from "@/schemas/commerce-access"
import {
  updateCommerceTeamRole,
  getCommerceTeamUsers,
} from "@/services/commerce-access"
import { formatCommerceTeamMembers } from "@/utils/server/commerce-organization"
import { createServiceError } from "@/services/helper"

export async function executeCommerceOrganization(
  request: Request,
  operation: string,
  input: unknown
) {
  const definition = getOrganizationOperation(operation)
  const teamRole = operation === "team-member-role"
  if (!definition && !teamRole) throw createServiceError("not_found", 404)
  const method = teamRole ? "POST" : definition!.method
  if (request.method !== method)
    throw createServiceError("method_not_allowed", 405)
  const actor = await requireCommerceUser(request, method !== "GET")
  // A delegated OAuth user must still own the live SSO session that issued the
  // grant. JWT expiry alone must never preserve authority after sign-out.
  if (typeof actor.sessionId !== "string")
    throw createServiceError("session_required", 401)
  const sessionRecord = await database.execute(
    sql`SELECT token FROM session WHERE id=${actor.sessionId}::uuid AND user_id=${actor.subject}::uuid AND expires_at>now()`
  )
  const token = sessionRecord.rows[0]?.token
  if (typeof token !== "string")
    throw createServiceError("session_revoked", 401)
  const auth = await getAuth(),
    context = await auth.$context
  // Native provider validation includes OAuth grant/token revocation, rather
  // than treating a signed JWT and an active login session as sufficient.
  const identity = await auth.api.oauth2UserInfo({
    headers: new Headers({
      authorization: request.headers.get("authorization")!,
    }),
  })
  if (identity.sub !== actor.subject)
    throw createServiceError("invalid_user_token", 401)
  const session = await context.internalAdapter.findSession(token)
  if (
    !session ||
    session.user.id !== actor.subject ||
    session.session.expiresAt <= new Date() ||
    (session.user as { status?: string }).status !== "active"
  )
    throw createServiceError("session_revoked", 401)
  // Live account ban checks use the same source as Commerce authorization.
  const active = await database.execute(
    sql`SELECT id FROM "user" WHERE id=${actor.subject}::uuid AND status='active' AND (NOT banned OR (ban_expires IS NOT NULL AND ban_expires<=now()))`
  )
  if (!active.rows.length) throw createServiceError("inactive_user", 403)
  if (teamRole)
    return updateCommerceTeamRole(
      actor.subject,
      commerceTeamRoleInput.parse(input)
    )
  const body = definition!.input.parse(input)
  let adminTeamMembers: unknown[] | undefined
  if (operation === "team-member") {
    // Native listTeamMembers requires assignment. Commerce also permits a
    // live organization owner/admin, without adding an artificial assignment.
    const teamId = (body as { teamId: string }).teamId
    const proof = await database.execute(
      sql`SELECT m.role FROM member m JOIN team t ON t.organization_id=m.organization_id WHERE t.id=${teamId}::uuid AND m.user_id=${actor.subject}::uuid`
    )
    if (
      String(proof.rows[0]?.role ?? "")
        .split(",")
        .some((role) => ["owner", "admin"].includes(role.trim()))
    )
      adminTeamMembers = await context.adapter.findMany({
        model: "teamMember",
        where: [{ field: "teamId", value: teamId }],
        limit: 1001,
      })
  }
  if (operation === "team-member-add") {
    const target = body as { teamId: string; userId: string }
    const membership = await database.execute(
      sql`SELECT m.role FROM member m JOIN team t ON t.organization_id=m.organization_id WHERE t.id=${target.teamId}::uuid AND m.user_id=${target.userId}::uuid`
    )
    if (membership.rows[0]?.role !== "member")
      throw createServiceError("team_requires_organization_member", 403)
  }
  const api = auth.api as unknown as Record<
    string,
    (options: Record<string, unknown>) => Promise<unknown>
  >
  const handler = api[definition!.api]
  if (!handler)
    throw new APIError("SERVICE_UNAVAILABLE", {
      message: "organization_api_unavailable",
    })
  const result =
    adminTeamMembers ??
    (await commerceOrganizationDelegation.run(
      { path: definition!.path, session },
      () =>
        handler({
          headers: new Headers(),
          ...(method === "GET"
            ? { query: body }
            : {
                body:
                  operation === "create"
                    ? { ...body, keepCurrentActiveOrganization: true }
                    : body,
              }),
        })
    ))
  if (operation === "team-member") {
    const members = commerceTeamMemberOutput.parse(result)
    return formatCommerceTeamMembers(
      members,
      await getCommerceTeamUsers(members.map((member) => member.userId))
    )
  }
  return result
}
