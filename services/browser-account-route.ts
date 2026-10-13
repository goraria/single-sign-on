import "server-only"
import { z } from "@gorth/structure/cores/zod"
import { deviceSessionSchema } from "@/schemas/browser-account"
import { appUrl } from "@/utils/environment"
import { auth } from "@/lib/auth/server/index"
import { requireUrl } from "@/utils/client/formatter"

export async function browserAccountRequest(
  path: string,
  cookie: string,
  origin: string,
  body?: Record<string, string>
) {
  return auth.handler(
    new Request(
      new URL("/auth/" + path, requireUrl(appUrl, "NEXT_PUBLIC_APP_URL")),
      {
        method: body ? "POST" : "GET",
        headers: {
          Cookie: cookie,
          Origin: origin,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      }
    )
  )
}

export async function getBrowserAccountSessions(
  cookie: string,
  origin: string
) {
  const [list, current] = await Promise.all([
    browserAccountRequest("multi-session/list-device-sessions", cookie, origin),
    browserAccountRequest(
      "get-session?disableCookieCache=true",
      cookie,
      origin
    ),
  ])
  if (!list.ok || !current.ok) throw new Error("browser_account_unavailable")
  const devices = z.array(deviceSessionSchema).parse(await list.json())
  // Axios represents JSON `null` as an empty Response body in toWebResponse.
  const currentBody = await current.text()
  const active = deviceSessionSchema
    .nullable()
    .parse(currentBody.trim() ? JSON.parse(currentBody) : null)
  // A pre-plugin session is still usable; it does not yet have a multi cookie.
  const sessions =
    active && !devices.some((item) => item.session.id === active.session.id)
      ? [...devices, active]
      : devices
  return { sessions, devices, active, currentResponse: current }
}
