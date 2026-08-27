const ssoServerUrl =
  process.env.SSO_SERVER_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8080"

interface BetterAuthRedirectPayload {
  redirect?: boolean
  url?: string
}

export interface AuthProxyContext {
  params: Promise<{ all?: string[] }>
}

const omittedResponseHeaders = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "transfer-encoding",
])

function getServerBaseUrl() {
  if (!ssoServerUrl) throw new Error("Missing SSO_SERVER_INTERNAL_URL")
  return ssoServerUrl
}

function copyRequestHeaders(request: Request) {
  const headers = new Headers(request.headers)

  for (const name of [
    "host",
    "content-length",
    "accept-encoding",
    "connection",
    "transfer-encoding",
  ]) {
    headers.delete(name)
  }

  const internalSecret = process.env.SSO_CLIENT_INTERNAL_SECRET
  if (internalSecret) headers.set("x-sso-client-secret", internalSecret)

  return headers
}

function getSetCookies(response: Response) {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[]
  }
  const cookies = headers.getSetCookie?.() ?? []
  const fallback = response.headers.get("set-cookie")

  return cookies.length > 0 ? cookies : fallback ? [fallback] : []
}

function normalizeClientCookie(cookie: string) {
  let value = cookie
    .replace(/;\s*Domain=[^;]*/gi, "")
    .replace(/;\s*Partitioned/gi, "")

  if (!/;\s*Path=/i.test(value)) value += "; Path=/"
  return value
}

function copyResponseHeaders(source: Response) {
  const headers = new Headers()

  source.headers.forEach((value, name) => {
    const normalizedName = name.toLowerCase()
    if (
      normalizedName !== "set-cookie" &&
      !omittedResponseHeaders.has(normalizedName)
    ) {
      headers.set(name, value)
    }
  })

  const cookies = getSetCookies(source)
  for (const cookie of cookies) {
    headers.append("set-cookie", normalizeClientCookie(cookie))
  }

  headers.set("x-gorth-auth-set-cookie-count", String(cookies.length))
  return headers
}

function resolveRedirectUrl(request: Request, value?: string) {
  if (!value) return null

  try {
    const target = new URL(value, new URL(request.url).origin)
    return target.protocol === "http:" || target.protocol === "https:"
      ? target
      : null
  } catch {
    return null
  }
}

async function getRedirectUrl(request: Request, response: Response) {
  if (
    !(response.headers.get("content-type") ?? "").includes("application/json")
  ) {
    return null
  }

  try {
    const payload = (await response.clone().json()) as BetterAuthRedirectPayload
    return payload.redirect ? resolveRedirectUrl(request, payload.url) : null
  } catch {
    return null
  }
}

function logProxyResponse(request: Request, path: string, response: Response) {
  console.info("[auth-proxy]", {
    method: request.method,
    path: `/auth/${path}`,
    status: response.status,
    requestHasCookie: request.headers.has("cookie"),
    setCookieCount: Number(
      response.headers.get("x-gorth-auth-set-cookie-count") ?? 0
    ),
  })

  return response
}

function unavailableResponse() {
  return Response.json(
    {
      error: "sso_server_unavailable",
      message: `Cannot connect to SSO server at ${getServerBaseUrl()}`,
    },
    { status: 503, headers: { "Cache-Control": "no-store" } }
  )
}

export async function handleAuthProxy(
  request: Request,
  context: AuthProxyContext
) {
  const { all = [] } = await context.params
  const path = all.join("/")
  const requestUrl = new URL(request.url)
  const targetUrl = new URL(`/auth/${path}`, getServerBaseUrl())
  targetUrl.search = requestUrl.search

  let upstream: Response

  try {
    upstream = await fetch(targetUrl, {
      method: request.method,
      headers: copyRequestHeaders(request),
      body: ["GET", "HEAD"].includes(request.method)
        ? undefined
        : await request.text(),
      redirect: "manual",
      cache: "no-store",
    })
  } catch {
    return unavailableResponse()
  }

  const redirectUrl = await getRedirectUrl(request, upstream)
  const headers = copyResponseHeaders(upstream)
  let response: Response

  if (redirectUrl) {
    headers.set("Location", redirectUrl.toString())
    headers.set("Cache-Control", "no-store")
    headers.delete("content-type")
    response = new Response(null, { status: 302, headers })
  } else {
    response = new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    })
  }

  return logProxyResponse(request, path, response)
}
