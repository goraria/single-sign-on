import { NextRequest, NextResponse } from "next/server"
import { assertMutationOrigin } from "@gorth/structure/modules/auth/server"
import { applySetCookies } from "better-auth/cookies"
import { browserAccountActionSchema } from "@/schemas/browser-account"
import {
  browserAccountRequest,
  getBrowserAccountSessions,
} from "@/services/browser-account-route"
import { appUrl } from "@/utils/environment"
import { requireUrl, withResponseCookies } from "@/utils/client/formatter"

export const runtime = "nodejs"
const headers = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
}
const origin = () => requireUrl(appUrl, "NEXT_PUBLIC_APP_URL").origin

export async function GET(request: NextRequest) {
  try {
    const { sessions, active, currentResponse } =
      await getBrowserAccountSessions(
        request.headers.get("cookie") ?? "",
        origin()
      )
    return withResponseCookies(
      NextResponse.json(
        {
          accounts: sessions.map((item) => ({
            sessionId: item.session.id,
            user: item.user,
            active: item.session.id === active?.session.id,
          })),
        },
        { headers }
      ),
      currentResponse
    )
  } catch {
    return NextResponse.json(
      { error: "accounts_unavailable" },
      { status: 503, headers }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    assertMutationOrigin(request.headers, [origin()])
  } catch {
    return NextResponse.json(
      { error: "invalid_origin" },
      { status: 403, headers }
    )
  }
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json")
    return NextResponse.json(
      { error: "invalid_content_type" },
      { status: 415, headers }
    )
  let input
  try {
    const reader = request.body?.getReader()
    if (!reader) throw new Error("missing_body")
    const chunks: Uint8Array[] = []
    let size = 0
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > 2048) {
          await reader.cancel()
          return NextResponse.json(
            { error: "payload_too_large" },
            { status: 413, headers }
          )
        }
        chunks.push(value)
      }
    } finally {
      reader.releaseLock()
    }
    const text = new TextDecoder("utf-8", { fatal: true }).decode(
      Buffer.concat(chunks)
    )
    input = browserAccountActionSchema.parse(JSON.parse(text))
  } catch {
    return NextResponse.json(
      { error: "invalid_request" },
      { status: 400, headers }
    )
  }
  try {
    const cookie = request.headers.get("cookie") ?? ""
    const { sessions, devices, active } = await getBrowserAccountSessions(
      cookie,
      origin()
    )
    const target = sessions.find((item) => item.session.id === input.sessionId)
    if (!target)
      return NextResponse.json(
        { error: "invalid_session" },
        { status: 401, headers }
      )
    const isDevice = devices.some(
      (item) => item.session.id === target.session.id
    )
    if (!isDevice && input.operation === "switch")
      return NextResponse.json({ ok: true }, { headers })
    let actionCookie = cookie
    let activated: Response | null = null
    if (isDevice && input.operation === "revoke" && !active) {
      // Native revoke requires an active session. Recover only this verified
      // device slot first, without re-authentication or trusting client tokens.
      activated = await browserAccountRequest(
        "multi-session/set-active",
        cookie,
        origin(),
        { sessionToken: target.session.token }
      )
      if (!activated.ok)
        return withResponseCookies(
          NextResponse.json(
            { error: "session_action_failed" },
            { status: activated.status, headers }
          ),
          activated
        )
      const forwarded = new Headers({ Cookie: cookie })
      applySetCookies(forwarded, activated.headers.getSetCookie())
      actionCookie = forwarded.get("cookie") ?? ""
    }
    // Legacy sessions may only revoke themselves through the core endpoint.
    const upstream = await browserAccountRequest(
      isDevice
        ? `multi-session/${input.operation === "switch" ? "set-active" : "revoke"}`
        : "revoke-session",
      actionCookie,
      origin(),
      isDevice
        ? { sessionToken: target.session.token }
        : { token: target.session.token }
    )
    let response: Response = NextResponse.json(
      upstream.ok ? { ok: true } : { error: "session_action_failed" },
      { status: upstream.ok ? 200 : upstream.status, headers }
    )
    if (activated) response = withResponseCookies(response, activated)
    response = withResponseCookies(response, upstream)
    if (upstream.ok && !isDevice && target.session.id === active?.session.id) {
      // Authoritative read expires the revoked legacy active/cache cookies;
      // unlike signOut(), this does not revoke the other browser accounts.
      const cleared = await browserAccountRequest(
        "get-session?disableCookieCache=true",
        cookie,
        origin()
      )
      if (!cleared.ok) throw new Error("session_action_unavailable")
      response = withResponseCookies(response, cleared)
    }
    return response
  } catch {
    return NextResponse.json(
      { error: "accounts_unavailable" },
      { status: 503, headers }
    )
  }
}
