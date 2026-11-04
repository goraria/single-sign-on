import { expect, it } from "vitest"
import { getTableConfig } from "drizzle-orm/pg-core"
import { getTableColumns } from "drizzle-orm"
import { getAuthTables } from "better-auth/db"
import { organization } from "better-auth/plugins/organization"
import {
  betterAuthSchema,
  team,
  teamMember,
  invitation,
  eventLog,
  eventLogType,
} from "@/database/schema"
it("uses native team model/table names with no duplicate legacy models", () => {
  expect(getTableConfig(team).name).toBe("team")
  expect(getTableConfig(teamMember).name).toBe("teamMember")
  expect(betterAuthSchema.team).toBe(team)
  expect(betterAuthSchema.teamMember).toBe(teamMember)
  const native = getAuthTables({
    plugins: [organization({ teams: { enabled: true } })],
  })
  for (const name of [
    "organization",
    "member",
    "invitation",
    "team",
    "teamMember",
  ] as const) {
    const cols = getTableColumns(betterAuthSchema[name])
    for (const field of Object.keys(native[name]!.fields))
      expect(cols).toHaveProperty(field)
  }
})
it("supports native comma-separated invitation teams without a single-team foreign key", () => {
  expect(invitation.teamId.getSQLType()).toBe("text")
  expect(
    getTableConfig(invitation).foreignKeys.some((f) =>
      f.reference().columns.some((c) => c.name === invitation.teamId.name),
    ),
  ).toBe(false)
})
it("retains event data under event_log", () => {
  expect(getTableConfig(eventLog).name).toBe("event_log")
  expect(eventLogType.enumName).toBe("event_log_type_enum")
})
