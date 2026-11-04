import { z } from "@gorth-io/structure/cores/zod"

const id = z.uuid(),
  org = { organizationId: id },
  team = { teamId: id }
const role = z.enum(["owner", "admin", "member"])
const name = z.string().trim().min(1).max(100)
// This allowlist is intentionally smaller than auth.api: no administrative
// addMember, session endpoints, caller-supplied userId or arbitrary API dispatch.
export const organizationOperations = {
  list: {
    api: "listOrganizations",
    path: "/organization/list",
    method: "GET",
    input: z.object({}).strict(),
  },
  create: {
    api: "createOrganization",
    path: "/organization/create",
    method: "POST",
    input: z
      .object({
        name,
        slug: z
          .string()
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
          .max(100),
      })
      .strict(),
  },
  update: {
    api: "updateOrganization",
    path: "/organization/update",
    method: "POST",
    input: z.object({ ...org, data: z.object({ name }).strict() }).strict(),
  },
  leave: {
    api: "leaveOrganization",
    path: "/organization/leave",
    method: "POST",
    input: z.object(org).strict(),
  },
  team: {
    api: "listOrganizationTeams",
    path: "/organization/list-teams",
    method: "GET",
    input: z.object(org).strict(),
  },
  "team-create": {
    api: "createTeam",
    path: "/organization/create-team",
    method: "POST",
    input: z.object({ ...org, name }).strict(),
  },
  "team-update": {
    api: "updateTeam",
    path: "/organization/update-team",
    method: "POST",
    input: z.object({ ...team, data: z.object({ name }).strict() }).strict(),
  },
  "team-remove": {
    api: "removeTeam",
    path: "/organization/remove-team",
    method: "POST",
    input: z.object({ ...org, ...team }).strict(),
  },
  member: {
    api: "listMembers",
    path: "/organization/list-members",
    method: "GET",
    input: z
      .object({
        ...org,
        limit: z.coerce.number().int().min(1).max(100).default(20),
        offset: z.coerce.number().int().min(0).max(100000).default(0),
      })
      .strict(),
  },
  "member-role": {
    api: "updateMemberRole",
    path: "/organization/update-member-role",
    method: "POST",
    input: z.object({ ...org, memberId: id, role }).strict(),
  },
  "member-remove": {
    api: "removeMember",
    path: "/organization/remove-member",
    method: "POST",
    input: z.object({ ...org, memberIdOrEmail: id }).strict(),
  },
  "team-member": {
    api: "listTeamMembers",
    path: "/organization/list-team-members",
    method: "GET",
    input: z.object(team).strict(),
  },
  "team-member-add": {
    api: "addTeamMember",
    path: "/organization/add-team-member",
    method: "POST",
    input: z.object({ ...team, userId: id }).strict(),
  },
  "team-member-remove": {
    api: "removeTeamMember",
    path: "/organization/remove-team-member",
    method: "POST",
    input: z.object({ ...org, ...team, userId: id }).strict(),
  },
  invitation: {
    api: "listInvitations",
    path: "/organization/list-invitations",
    method: "GET",
    input: z.object(org).strict(),
  },
  "invitation-create": {
    api: "createInvitation",
    path: "/organization/invite-member",
    method: "POST",
    input: z
      .object({
        ...org,
        email: z.email(),
        role: z.literal("member").default("member"),
        teamId: id.optional(),
        resend: z.boolean().optional(),
      })
      .strict(),
  },
  "invitation-cancel": {
    api: "cancelInvitation",
    path: "/organization/cancel-invitation",
    method: "POST",
    input: z.object({ invitationId: id }).strict(),
  },
  "invitation-accept": {
    api: "acceptInvitation",
    path: "/organization/accept-invitation",
    method: "POST",
    input: z.object({ invitationId: id }).strict(),
  },
  "invitation-reject": {
    api: "rejectInvitation",
    path: "/organization/reject-invitation",
    method: "POST",
    input: z.object({ invitationId: id }).strict(),
  },
  "my-invitation": {
    api: "listUserInvitations",
    path: "/organization/list-user-invitations",
    method: "GET",
    input: z.object({}).strict(),
  },
} as const

export function getOrganizationOperation(value: string) {
  return Object.hasOwn(organizationOperations, value)
    ? organizationOperations[value as keyof typeof organizationOperations]
    : null
}
export const commerceTeamMemberOutput = z
  .array(
    z
      .object({
        id: z.uuid(),
        teamId: z.uuid(),
        userId: z.uuid(),
        role: z.string().optional(),
        createdAt: z.union([z.date(), z.string()]),
      })
      .passthrough()
  )
  .max(1000)
