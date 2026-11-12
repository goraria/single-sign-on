import { beforeAll, beforeEach, expect, it, vi } from "vitest"
import {
  generateKeyPair,
  exportJWK,
  SignJWT,
} from "@gorth-io/structure/cores/jose"
const registry = vi.hoisted(() => vi.fn())
vi.mock("server-only", () => ({}))
vi.mock("@/utils/environment", () => ({
  betterAuthUrl: "https://sso-bearer.test",
}))
vi.mock("@/services/commerce-access", () => ({
  getCommerceRegistration: registry,
  updateCommerceTeamRole: vi.fn(),
}))
// Keep service errors real without loading the database in this verifier suite.
vi.mock("@/services/helper", async () => {
  const { HTTPException } = await import("hono/http-exception")
  return {
    createServiceError: (message: string, status: any) =>
      new HTTPException(status, { message }),
  }
})
import { requireCommerceUser } from "@/lib/auth/server/commerce-access"
let keys: Awaited<ReturnType<typeof generateKeyPair>>,
  jwk: Record<string, unknown>
const resource = "https://commerce.test",
  client = "gorth-online-marketplace-solution",
  subject = crypto.randomUUID()
beforeAll(async () => {
  keys = await generateKeyPair("ES256")
  jwk = {
    ...(await exportJWK(keys.publicKey)),
    kid: "commerce-sso",
    alg: "ES256",
  }
})
beforeEach(() => {
  registry.mockReset().mockResolvedValue(resource)
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json({ keys: [jwk] })
  )
})
async function request(
  override: Record<string, unknown> = {},
  headers: Record<string, string | undefined> = {}
) {
  const now = Math.floor(Date.now() / 1000),
    token = await new SignJWT({
      iss: "https://sso-bearer.test/auth",
      aud: resource,
      sub: subject,
      client_id: client,
      scope: "marketplace:read",
      iat: now,
      exp: now + 120,
      ...override,
    })
      .setProtectedHeader({ alg: "ES256", typ: "at+jwt", kid: "commerce-sso" })
      .sign(keys.privateKey)
  return new Request("https://sso-bearer.test/auth/commerce/authorization", {
    headers: {
      Authorization: "Bearer " + token,
      "x-oauth-resource": resource,
      "x-oauth-client-id": client,
      ...Object.fromEntries(
        Object.entries(headers).filter(([, v]) => v !== undefined)
      ),
    } as Record<string, string>,
  })
}
it("uses native Better Auth verification and exact persisted client/resource", async () => {
  expect(await requireCommerceUser(await request())).toEqual({
    subject,
    resource,
  })
  expect(registry).toHaveBeenCalledWith(resource, client)
})
it("accepts the exact local Marketplace client without classifying it as Restaurant", async () => {
  const local = client + "-local"
  expect(
    await requireCommerceUser(
      await request({ client_id: local }, { "x-oauth-client-id": local })
    )
  ).toMatchObject({ subject, resource })
  expect(registry).toHaveBeenCalledWith(resource, local)
  await expect(
    requireCommerceUser(
      await request(
        { client_id: local, scope: "restaurant:read" },
        { "x-oauth-client-id": local }
      )
    )
  ).rejects.toBeDefined()
  await expect(
    requireCommerceUser(await request({ client_id: local }))
  ).rejects.toBeDefined()
  await expect(
    requireCommerceUser(
      await request(
        { client_id: local + "-attacker" },
        { "x-oauth-client-id": local + "-attacker" }
      )
    )
  ).rejects.toMatchObject({ status: 403 })
})
it.each([
  { aud: "https://other.test" },
  { iss: "https://evil.test/auth" },
  { scope: "restaurant:read" },
  { sub: client },
  { client_id: "foreign" },
  { iat: 1, exp: 9999999999 },
  { exp: 1 },
])("rejects incorrect native claims %j", async (claims) => {
  await expect(requireCommerceUser(await request(claims))).rejects.toBeDefined()
})
it.each([
  { Cookie: "session=x" },
  { Origin: "https://app.test" },
  { "sec-fetch-site": "same-origin" },
])("denies browser/cookie access %j", async (headers) => {
  await expect(
    requireCommerceUser(await request({}, headers))
  ).rejects.toMatchObject({ status: 403 })
  expect(registry).not.toHaveBeenCalled()
})
it("rejects an unregistered or disabled resource before verification", async () => {
  registry.mockRejectedValue(new Error("disabled"))
  await expect(requireCommerceUser(await request())).rejects.toBeDefined()
})
