import { expect, it } from "vitest"
import {
  localOAuthApplications,
  planLocalOAuthResources,
  type LocalOAuthClientRecord,
  type LocalOAuthResourceRecord,
} from "@/utils/oauth-local-client"

function fixture() {
  const clients: LocalOAuthClientRecord[] = localOAuthApplications.map((a) => ({
    client_id: a.clientId,
    redirect_uris: [a.origin + "/auth/callback/gorth"],
    scopes: ["openid", `${a.scope}:read`, `${a.scope}:write`],
    disabled: false,
    public: true,
    require_pkce: true,
    token_endpoint_auth_method: "none",
    environment: "local",
    has_secret: false,
  }))
  const resources: LocalOAuthResourceRecord[] = [
    ...new Set(
      localOAuthApplications.flatMap((a) => [a.origin, ...a.resources])
    ),
  ].map((identifier) => ({
    identifier,
    disabled: false,
    allowed_scopes: ["openid"],
  }))
  return { clients, resources }
}
it("plans only local bindings and existing application scopes without mutating inputs", () => {
  const f = fixture(),
    before = structuredClone(f),
    plan = planLocalOAuthResources(f.clients, f.resources, [])
  expect(plan.links).toHaveLength(49)
  expect(plan.links.every((l) => l.client_id.endsWith("-local"))).toBe(true)
  expect(plan.policies.flatMap((p) => p.addedScopes)).not.toEqual(
    expect.arrayContaining(["admin", "master"])
  )
  expect(
    plan.policies.find((p) => p.identifier === "http://localhost:5059")
      ?.addedScopes
  ).toEqual(["marketplace:read", "marketplace:write"])
  expect(f).toEqual(before)
})
it("is idempotent and retains existing resource grants", () => {
  const f = fixture(),
    plan = planLocalOAuthResources(f.clients, f.resources, [])
  for (const p of plan.policies)
    f.resources
      .find((r) => r.identifier === p.identifier)!
      .allowed_scopes!.push(...p.addedScopes)
  expect(
    planLocalOAuthResources(f.clients, f.resources, [
      ...plan.links,
      {
        client_id: "unrelated-production",
        resource_id: "https://api.example.test",
      },
    ])
  ).toEqual({ links: [], policies: [] })
})
it.each([
  { disabled: true },
  { public: false },
  { require_pkce: false },
  { token_endpoint_auth_method: "client_secret_post" },
  { environment: "production" },
  { has_secret: true },
])("refuses incompatible registration %j", (patch) => {
  const f = fixture()
  Object.assign(f.clients[0]!, patch)
  expect(() => planLocalOAuthResources(f.clients, f.resources, [])).toThrow(
    "local_client_requires_review"
  )
})
it("refuses a missing client, wrong callback and disabled resource", () => {
  const f = fixture()
  expect(() =>
    planLocalOAuthResources(f.clients.slice(1), f.resources, [])
  ).toThrow("local_client_requires_review")
  f.clients[0]!.redirect_uris = [
    "https://production.example/auth/callback/gorth",
  ]
  expect(() => planLocalOAuthResources(f.clients, f.resources, [])).toThrow(
    "local_callback_requires_review"
  )
  f.clients[0]!.redirect_uris = [
    localOAuthApplications[0]!.origin + "/auth/callback/gorth",
  ]
  f.resources[0]!.disabled = true
  expect(() => planLocalOAuthResources(f.clients, f.resources, [])).toThrow(
    "resource_requires_review"
  )
})
it("never treats resource policy additions as permission to expand a client scope ceiling", () => {
  const f = fixture()
  f.clients[0]!.scopes = ["openid"]
  expect(() => planLocalOAuthResources(f.clients, f.resources, [])).toThrow(
    "client_scope_requires_review"
  )
})
