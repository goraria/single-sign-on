import { expect, it } from "vitest"
import seeds from "@/database/seeds/oauth-clients.json"

it.each([
  [
    "gorth-browser-website",
    "http://localhost:5503",
    "https://gorth-browser.vercel.app",
  ],
  [
    "gorth-launcher-website",
    "http://localhost:5504",
    "https://gorth-launcher.vercel.app",
  ],
])(
  "separates exact local and production redirects for %s",
  (id, local, production) => {
    for (const [clientId, origin] of [
      [id, production],
      [id + "-local", local],
    ]) {
      const client = seeds.find((entry) => entry.client_id === clientId)
      expect(client?.redirect_uris).toEqual([origin + "/auth/callback/gorth"])
      expect(client?.post_logout_redirect_uris).toEqual([origin])
      expect(client?.backchannel_logout_uri).toBe(
        origin + "/auth/backchannel-logout"
      )
      expect(client?.uri).toBe(origin)
      expect(client?.public).toBe(true)
      expect(client?.require_pkce).toBe(true)
      expect(client?.token_endpoint_auth_method).toBe("none")
    }
  }
)
