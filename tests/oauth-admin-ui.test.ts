import { readFileSync, existsSync } from "node:fs"
import { createElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import { oauthResourceSeeds } from "@/database/seeds/oauth-resources"
import { adminServices } from "@/utils/constant"
import type { OAuthResource } from "@/services/client/admin"

vi.mock("@gorth/primitive/default/dialog", () => {
  const element = ({ children }: { children: ReactNode }) =>
    createElement("div", null, children)
  return {
    Dialog: element,
    DialogContent: element,
    DialogHeader: element,
    DialogTitle: element,
    DialogDescription: element,
  }
})

import { OAuthResourceDetails } from "@/components/admin/oauth-details"
import {
  getOAuthResourceService,
  toOAuthResourceFormState,
  toOAuthResourcePayload,
} from "@/utils/client/oauth"

function resource(application = "shared-discovery-engine"): OAuthResource {
  const seed = oauthResourceSeeds.find(
    (item) => item.metadata.application === application
  )!
  return {
    id: "resource-id",
    identifier: seed.identifier,
    name: seed.name,
    accessTokenTtl: seed.accessTokenTtl,
    refreshTokenTtl: null,
    signingAlgorithm: null,
    signingKeyId: null,
    allowedScopes: seed.allowedScopes,
    dpopBoundAccessTokensRequired: false,
    disabled: false,
    application,
    policyVersion: 1,
    createdAt: "2026-10-15T00:00:00Z",
    updatedAt: "2026-10-15T00:00:00Z",
  }
}
it.each(adminServices.map((service) => [service.repository] as const))(
  "shows the previous %s service overview inside resource details",
  (repository) => {
    const item = resource(`shared-${repository}`)
    const html = renderToStaticMarkup(
      createElement(OAuthResourceDetails, { resource: item, onClose() {} })
    )
    expect(html).toContain(repository)
    expect(html).toContain(item.identifier)
    expect(html).toContain("Service status")
    expect(html).toContain("Requests")
    expect(html).toContain("Errors")
    expect(html).toContain("No production metrics are being queried.")
    expect(html).toContain("Allowed scopes")
    expect(html).toContain("Access token TTL")
  }
)
it("does not misidentify a private credential audience as a platform service", () => {
  expect(getOAuthResourceService({ application: "sso" })).toBeUndefined()
})
it("preserves the distinction between unrestricted scopes and an empty deny-all list", () => {
  const unrestricted = toOAuthResourceFormState({
    ...resource(),
    allowedScopes: null,
  })
  expect(unrestricted.restrictScopes).toBe(false)
  expect(toOAuthResourcePayload(unrestricted).allowedScopes).toBeNull()
  const denied = toOAuthResourceFormState({ ...resource(), allowedScopes: [] })
  expect(denied.restrictScopes).toBe(true)
  expect(toOAuthResourcePayload(denied).allowedScopes).toEqual([])
})
it("normalizes form input and keeps empty TTL/key/algorithm overrides null", () => {
  const form = toOAuthResourceFormState()
  const payload = toOAuthResourcePayload({
    ...form,
    name: " Service ",
    identifier: " https://service.example ",
    allowedScopes: ["openid", "openid", " email "],
  })
  expect(payload.name).toBe("Service")
  expect(payload.identifier).toBe("https://service.example")
  expect(payload.allowedScopes).toEqual(["openid", "email"])
  expect(payload.accessTokenTtl).toBeNull()
  expect(payload.refreshTokenTtl).toBeNull()
  expect(payload.signingAlgorithm).toBeNull()
  expect(payload.signingKeyId).toBeNull()
})
it("uses matching dropdown trigger sizes and removes page headers and the old form", () => {
  const root = new URL("../", import.meta.url)
  for (const path of ["client", "resource"]) {
    const source = readFileSync(
      new URL(`features/admin/oauth/${path}/index.tsx`, root),
      "utf8"
    )
    expect(source).toContain('variant="ghost"')
    expect(source).toContain('size="icon"')
    expect(source).toContain(
      'import { NavIdentity } from "@gorth/primitive/dashboard/nav-user"'
    )
    expect(source).toContain("<NavIdentity")
    expect(source).toContain("name: row.original.name")
    expect(source).toContain(
      path === "client"
        ? "description={row.original.clientId}"
        : "description={row.original.identifier}"
    )
    expect(source).toContain("Show")
    expect(source).toContain("Edit")
    expect(source).toContain("Delete")
    expect(source).not.toContain("<h1")
    expect(source).not.toContain("Inspect registered audiences")
  }
  expect(
    existsSync(new URL("components/admin/application-form.tsx", root))
  ).toBe(false)
  const form = readFileSync(new URL("components/auth/oauth.tsx", root), "utf8")
  expect(form).toContain("export function ApplicationForm")
  expect(form).toContain("export function OAuthResourceForm")
  expect(form).not.toContain("<h1")
})
