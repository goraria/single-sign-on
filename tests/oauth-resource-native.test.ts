import { expect, it } from "vitest"
import { Browser, createFixture } from "./fixtures/multi-session"

it("uses the installed Better Auth resource CRUD, preserving private metadata and clearing policy defaults", async () => {
  const auth = createFixture()
  const browser = new Browser(auth)
  await browser.signup("Resource administrator", "resource-admin@example.test")
  const headers = new Headers({ cookie: browser.cookie })
  const identifier = "https://service.example/resource%20name"
  const resource = await auth.api.adminCreateOAuthResource({
    headers,
    body: {
      identifier,
      name: "Fixture service",
      allowedScopes: ["openid"],
      accessTokenTtl: 600,
      metadata: { application: "shared-discovery-engine" },
    },
  })
  const params = { identifier: encodeURIComponent(identifier) }
  expect((await auth.api.adminGetOAuthResource({ headers, params })).id).toBe(
    resource.id
  )
  const updated = await auth.api.adminUpdateOAuthResource({
    headers,
    params,
    body: { name: "Updated service", accessTokenTtl: null, allowedScopes: [] },
  })
  expect(updated.name).toBe("Updated service")
  expect(updated.accessTokenTtl).toBeNull()
  expect(updated.allowedScopes).toEqual([])
  expect(updated.metadata).toEqual({ application: "shared-discovery-engine" })
  expect(await auth.api.adminDeleteOAuthResource({ headers, params })).toEqual({
    deleted: true,
  })
  await expect(
    auth.api.adminGetOAuthResource({ headers, params })
  ).rejects.toThrow()
  await expect(
    auth.api.adminCreateOAuthResource({ body: { identifier } })
  ).rejects.toThrow()
})
