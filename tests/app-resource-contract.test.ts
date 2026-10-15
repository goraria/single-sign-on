import { readFileSync } from "node:fs"
import { expect, it } from "vitest"
import {
  oauthClientResourceSeeds,
  oauthResourceSeeds,
} from "@/database/seeds/oauth-resources"

const apps = [
  ["interactive-messaging-portal", "chat"],
  ["video-streaming-platform", "video"],
  ["content-reader-platform", "reader"],
  ["social-networking-portal", "social"],
  ["task-productivity-suite", "task"],
  ["online-marketplace-solution", "marketplace"],
] as const

for (const [repo, domain] of apps) {
  it(`${domain} env example requests only registered, linked resources with its API scopes`, () => {
    const lines = readFileSync(
      new URL(`../../${repo}/.env.example`, import.meta.url),
      "utf8"
    ).split("\n")
    const resources = lines
      .filter((line) => /^NEXT_OAUTH_(?:[A-Z]+_)?AUDIENCE=/.test(line))
      .map((line) => line.slice(line.indexOf("=") + 1))
      .filter(Boolean)
    const client = oauthClientResourceSeeds.find(
      (client) => client.clientId === `gorth-${repo}`
    )!
    expect(client).toBeDefined()
    for (const resource of resources) {
      const policy = oauthResourceSeeds.find(
        (policy) => policy.identifier === resource
      )
      expect(policy, resource).toBeDefined()
      expect([...client.resourceIds], resource).toContain(resource)
      expect(policy!.allowedScopes).toContain(`${domain}:read`)
      expect(policy!.allowedScopes).toContain(`${domain}:write`)
      expect(resource).not.toMatch(/:707[2-8]/)
    }
  })
}
