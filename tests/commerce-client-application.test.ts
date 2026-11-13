import { expect, it } from "vitest"
import { resolveCommerceClientApplication } from "@/utils/commerce-client-application"
const registry = { referenceId: "sso-administration", metadata: {}, scopes: ["marketplace:read", "marketplace:write"] }
it("uses registered scopes without knowing or allowlisting a client ID", () => {
  expect(resolveCommerceClientApplication(registry)).toBe("marketplace")
  expect(resolveCommerceClientApplication({ ...registry, scopes: ["restaurant:read"] })).toBe("restaurant")
})
it("accepts an explicit administrative label only with matching registered scopes", () => {
  expect(resolveCommerceClientApplication({ ...registry, metadata: { commerceApplication: "marketplace" } })).toBe("marketplace")
  expect(resolveCommerceClientApplication({ ...registry, metadata: { commerceApplication: "restaurant" } })).toBeNull()
})
it("rejects unmanaged, unbound and ambiguous registrations", () => {
  expect(resolveCommerceClientApplication({ ...registry, referenceId: "someone" })).toBeNull()
  expect(resolveCommerceClientApplication({ ...registry, scopes: ["chat:read"] })).toBeNull()
  expect(resolveCommerceClientApplication({ ...registry, scopes: ["marketplace:read", "restaurant:read"] })).toBeNull()
  expect(resolveCommerceClientApplication({ ...registry, metadata: { application: "chat" } })).toBeNull()
})
