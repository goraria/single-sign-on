import { expect, it } from "vitest"
import {
  generateOAuthClientId,
  generateOAuthClientSecret,
  withRequestedOAuthClientId,
} from "@/utils/oauth-client-credentials"

it("generates 32-character alphanumeric secrets using cryptographic randomness", () => {
  const values = Array.from({ length: 100 }, generateOAuthClientSecret)
  expect(new Set(values).size).toBe(100)
  for (const value of values) expect(value).toMatch(/^[A-Za-z0-9]{32}$/)
})
it("isolates administrator-selected IDs between concurrent native registrations", async () => {
  const values = await Promise.all(
    ["admin-chosen-a", "admin-chosen-b"].map((id) =>
      withRequestedOAuthClientId(id, async () => {
        await new Promise((resolve) => setTimeout(resolve, 1))
        return generateOAuthClientId()
      })
    )
  )
  expect(values).toEqual(["admin-chosen-a", "admin-chosen-b"])
  expect(generateOAuthClientId()).not.toBe("admin-chosen-b")
})
