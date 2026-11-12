import { readFileSync } from "node:fs"
import { expect, it } from "vitest"

// The bootstrap manifest is historical input, not the production policy.
// Database-backed client/resource bindings are verified separately against SSO.
const apps = [
  ["interactive-messaging-portal", "chat"],
  ["video-streaming-platform", "video"],
  ["content-reader-platform", "reader"],
  ["social-networking-portal", "social"],
  ["task-productivity-suite", "task"],
  ["online-marketplace-solution", "marketplace"],
] as const

for (const [repo, domain] of apps) {
  it(domain + " resource examples contain exact HTTPS or loopback origins, never API paths or credentials", () => {
    const lines = readFileSync(new URL("../../" + repo + "/.env.example", import.meta.url), "utf8").split("\n")
    const resources = lines.filter((line) => /^NEXT_OAUTH_(?:[A-Z]+_)?AUDIENCE=/.test(line))
      .map((line) => line.slice(line.indexOf("=") + 1)).filter(Boolean)
    expect(resources.length).toBeGreaterThan(0)
    expect(resources.every((resource) => resource.length < 2048)).toBe(true)
    for (const value of resources) {
      const url = new URL(value)
      expect(value).toBe(url.origin)
      expect(url.username || url.password || url.search || url.hash).toBe("")
      expect(url.protocol === "https:" ||
        (url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))).toBe(true)
      expect(value).not.toMatch(/:707[2-8]/)
    }
  })
}
