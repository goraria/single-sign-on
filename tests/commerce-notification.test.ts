import { beforeAll, beforeEach, expect, it, vi } from "vitest"
import { generateKeyPair, exportJWK, SignJWT } from "@gorth-io/structure/cores/jose"
const state = vi.hoisted(() => ({ execute: vi.fn() }))
vi.mock("server-only", () => ({}))
vi.mock("@/database", () => ({ database: { execute: state.execute } }))
vi.mock("@/services/helper", async () => {
  const { HTTPException } = await import("hono/http-exception")
  return { createServiceError: (message: string, status: any) => new HTTPException(status, { message }) }
})
vi.mock("@/utils/environment", () => ({ betterAuthUrl: "https://recipient-sso.test" }))
import { requireCommerceNotificationClient } from "@/lib/auth/server/commerce-notification"
import { getCommerceNotificationRecipients } from "@/services/commerce-notification"
const audience = "https://recipient-sso.test/auth/commerce/notification-recipient"
let key: Awaited<ReturnType<typeof generateKeyPair>>, jwk: Record<string, unknown>
beforeAll(async () => {
  key = await generateKeyPair("ES256")
  jwk = { ...await exportJWK(key.publicKey), alg: "ES256", kid: "recipients" }
})
beforeEach(() => {
  state.execute.mockReset().mockResolvedValue({ rows: [{ client_id: "commerce-machine" }] })
  vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ keys: [jwk] }))
})
async function request(claims: Record<string, unknown> = {}, headers: Record<string, string> = {}) {
  const now = Math.floor(Date.now() / 1000)
  const token = await new SignJWT({ iss: "https://recipient-sso.test/auth", aud: audience,
    sub: "commerce-machine", client_id: "commerce-machine", scope: "commerce:notification:recipient",
    iat: now, exp: now + 120, ...claims,
  }).setProtectedHeader({ alg: "ES256", kid: "recipients", typ: "at+jwt" }).sign(key.privateKey)
  return new Request(audience, { headers: { Authorization: "Bearer " + token, ...headers } })
}
it("uses native verification and a current persisted machine registration before directory access", async () => {
  await requireCommerceNotificationClient(await request(), "marketplace")
  expect(state.execute).toHaveBeenCalledOnce()
})
it.each([
  { aud: "https://other.test" }, { scope: "marketplace:read" }, { sub: crypto.randomUUID() },
  { sid: "user-session" }, { exp: 1 }, { exp: Math.floor(Date.now() / 1000) + 600 },
  { status: "suspended" },
])("rejects a browser grant or wrong machine constraints: %j", async claims => {
  await expect(requireCommerceNotificationClient(await request(claims), "marketplace")).rejects.toBeDefined()
  expect(state.execute).not.toHaveBeenCalled()
})
const browserHeaders: Record<string, string>[] = [{ Cookie: "session=x" }, { Origin: "https://app.test" }, { "sec-fetch-site": "same-origin" }]
it.each(browserHeaders)(
  "rejects browser credentials %j", async headers => {
    await expect(requireCommerceNotificationClient(await request({}, headers), "marketplace")).rejects.toMatchObject({ status: 403 })
    expect(state.execute).not.toHaveBeenCalled()
  })
it("checks live disablement, purpose and scope ceiling through registry lookup", async () => {
  state.execute.mockResolvedValue({ rows: [] })
  await expect(requireCommerceNotificationClient(await request(), "marketplace")).rejects.toMatchObject({ status: 403 })
})
it("deduplicates org administrators and filters team roles by existing business read permissions", async () => {
  const person = (id: string, org_role: string, team_role: string | null) => ({ id, name: id, email: id + "@fixture.test", org_role, team_role })
  state.execute.mockResolvedValue({ rows: [person("owner", "owner", null), person("owner", "owner", "viewer"),
    person("staff", "member", "staff"), person("catalog", "member", "catalog"), person("member", "member", "member")] })
  const result = await getCommerceNotificationRecipients({ application: "marketplace", organizationId: crypto.randomUUID(), teamId: crypto.randomUUID(), capability: "order" })
  expect(result.recipients.map(person => person.subject)).toEqual(["owner", "staff"])
})
it("rejects truncated staff snapshots instead of silently dropping recipients", async () => {
  state.execute.mockResolvedValue({ rows: Array.from({ length: 1001 }, () => ({})) })
  await expect(getCommerceNotificationRecipients({ application: "marketplace", organizationId: crypto.randomUUID(), capability: "order" })).rejects.toMatchObject({ status: 503 })
})
