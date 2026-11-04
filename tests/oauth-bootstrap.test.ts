import { expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({
  resources: new Map<string, Record<string, unknown>>(),
  tables: [] as unknown[],
}))
vi.mock("@/database", () => ({
  database: {
    insert: (table: unknown) => {
      state.tables.push(table)
      return {
        values: (row: Record<string, unknown>) => ({
          onConflictDoNothing: async () => {
            if (!state.resources.has(row.identifier as string))
              state.resources.set(row.identifier as string, row)
          },
        }),
      }
    },
  },
}))
import { bootstrapOAuthResources } from "@/database/bootstrap-oauth-resources"
import { oauthResource } from "@/database/schema"
import { oauthResourceSeeds } from "@/database/seeds/oauth-resources"

it("preserves disabled status, custom policy and removed links across repeated bootstrap", async () => {
  const seed = oauthResourceSeeds[0]
  const existing = {
    ...seed,
    name: "Admin name",
    allowedScopes: [],
    accessTokenTtl: 30,
    disabled: true,
    metadata: { custom: "preserved" },
  }
  state.resources.clear()
  state.tables = []
  state.resources.set(seed.identifier, existing)
  await bootstrapOAuthResources(oauthResourceSeeds)
  await bootstrapOAuthResources(oauthResourceSeeds)
  expect(state.resources.size).toBe(oauthResourceSeeds.length)
  expect(state.resources.get(seed.identifier)).toBe(existing)
  expect(state.tables.every((table) => table === oauthResource)).toBe(true)
})
