import { expect, it } from "vitest"
import {
  planOAuthClientMigration,
  type OAuthClientMigrationRecord,
} from "@/utils/oauth-client-migration"

const reference = "sso-administration"
function record(): OAuthClientMigrationRecord {
  return {
    id: "original-row",
    client_id: "example-client",
    name: "Example",
    uri: "http://localhost:5503",
    redirect_uris: [
      "http://localhost:5503/auth/callback/gorth",
      "https://app.example/callback",
      "https://alternate.example/callback",
    ],
    post_logout_redirect_uris: [
      "http://localhost:5503",
      "https://app.example",
      "https://alternate.example",
    ],
    backchannel_logout_uri: "http://localhost:5503/auth/backchannel-logout",
    reference_id: "sso_application:example-client",
    user_id: null,
    public: true,
    require_pkce: true,
    token_endpoint_auth_method: "none",
    client_discovery_id: null,
    scopes: ["openid", "profile"],
    client_credentials_scopes: [],
    metadata: { description: "Preserved" },
  }
}

it("partitions registered URLs without dropping alternate production domains or changing the original", () => {
  const source = record()
  const before = structuredClone(source)
  const plan = planOAuthClientMigration(source, false, reference)!
  expect(source).toEqual(before)
  expect(plan.clientId).toBe(source.client_id)
  expect(plan.patch.redirect_uris).toEqual(source.redirect_uris.slice(1))
  expect(plan.patch.uri).toBe("https://app.example")
  expect(plan.patch.backchannel_logout_uri).toBe(
    "https://app.example/auth/backchannel-logout"
  )
  expect(plan.patch.metadata).toEqual({
    description: "Preserved",
    environment: "production",
  })
  expect(plan.local?.client_id).toBe("example-client-local")
  expect(plan.local?.redirect_uris).toEqual([source.redirect_uris[0]])
  expect(plan.local?.backchannel_logout_uri).toBe(source.backchannel_logout_uri)
})
it("keeps native loopback client IDs and unconfigured backchannels", () => {
  const source = record()
  source.redirect_uris = [source.redirect_uris[0]]
  source.post_logout_redirect_uris = []
  source.uri = source.backchannel_logout_uri = null
  const plan = planOAuthClientMigration(source, false, reference)!
  expect(plan.local).toBeNull()
  expect(plan.patch.uri).toBeNull()
  expect(plan.patch.backchannel_logout_uri).toBeNull()
  expect(plan.patch.metadata.environment).toBe("local")
})
it("does not create logout callbacks that were never configured", () => {
  const source = record()
  source.backchannel_logout_uri = null
  const plan = planOAuthClientMigration(source, false, reference)!
  expect(plan.patch.backchannel_logout_uri).toBeNull()
  expect(plan.local?.backchannel_logout_uri).toBeNull()
})
it("never clones credentials or takes over user-owned and unrelated clients", () => {
  expect(() => planOAuthClientMigration(record(), true, reference)).toThrow(
    "separate_registration"
  )
  expect(
    planOAuthClientMigration(
      { ...record(), user_id: "user-owned" },
      false,
      reference
    )
  ).toBeNull()
  expect(
    planOAuthClientMigration(
      { ...record(), reference_id: "another-reference" },
      false,
      reference
    )
  ).toBeNull()
})
it("is stable for already partitioned registrations", () => {
  const source = record()
  const first = planOAuthClientMigration(source, false, reference)!
  const second = planOAuthClientMigration(
    { ...source, ...first.patch },
    false,
    reference
  )!
  expect(second.local).toBeNull()
  expect(second.patch).toEqual(first.patch)
})
it("requires review for inconsistent existing registrations instead of silently dropping logout URLs", () => {
  const source = record()
  source.redirect_uris = ["https://app.example/callback"]
  expect(() => planOAuthClientMigration(source, false, reference)).toThrow(
    "homepage_environment_mismatch"
  )
  source.uri = "https://app.example"
  expect(() => planOAuthClientMigration(source, false, reference)).toThrow(
    "logout_environment_mismatch"
  )
})
it.each([
  "https://user:password@app.example/callback",
  "https://app.example/callback#fragment",
  "http://untrusted.example/callback",
])("rejects unsafe existing URLs %s", (url) => {
  expect(() =>
    planOAuthClientMigration(
      { ...record(), redirect_uris: [url] },
      false,
      reference
    )
  ).toThrow()
})
