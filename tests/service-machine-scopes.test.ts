import { readFileSync } from "node:fs"
import { expect, it } from "vitest"
import { oauthResourceSeeds } from "@/database/seeds/oauth-resources"
import {
  discoveryIndexScopes,
  notificationPublishScopes,
  serviceMachineScopes,
} from "@/utils/oauth-service-scopes"

it("declares dedicated machine scopes only on their owning resource", () => {
  expect(serviceMachineScopes).toHaveLength(12)
  for (const scope of notificationPublishScopes) {
    expect(
      oauthResourceSeeds.find(
        (row) => row.identifier === "http://localhost:5052"
      )!.allowedScopes
    ).toContain(scope)
    expect(
      oauthResourceSeeds.find(
        (row) => row.identifier === "http://localhost:5054"
      )!.allowedScopes
    ).not.toContain(scope)
  }
  for (const scope of discoveryIndexScopes)
    expect(
      oauthResourceSeeds.find(
        (row) => row.identifier === "http://localhost:5054"
      )!.allowedScopes
    ).toContain(scope)
})
it("does not grant new machine privileges to existing public clients", () => {
  const clients = JSON.parse(
    readFileSync(
      new URL("../database/seeds/oauth-clients.json", import.meta.url),
      "utf8"
    )
  )
  for (const client of clients)
    for (const scope of serviceMachineScopes) {
      expect(client.client_credentials_scopes ?? []).not.toContain(scope)
      expect(client.scopes ?? []).not.toContain(scope)
    }
})
