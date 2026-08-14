export const runtime = "nodejs"

const ssoServerUrl =
  process.env.SSO_SERVER_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8080"

interface BetterAuthRedirectPayload {
  redirect?: boolean
  url?: string
}

function getServerBaseUrl() {
  if (!ssoServerUrl) {
    throw new Error("Missing SSO_SERVER_INTERNAL_URL")
  }

  return ssoServerUrl
}

function copyRequestHeaders(request: Request) {
  const headers = new Headers(request.headers)

  headers.delete("host")
  headers.delete("content-length")

  if (process.env.SSO_CLIENT_INTERNAL_SECRET) {
    headers.set("x-sso-client-secret", process.env.SSO_CLIENT_INTERNAL_SECRET)
  }

  return headers
}

function appendResponseHeaders(target: Headers, source: Response) {
  source.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "set-cookie") {
      target.set(key, value)
    }
  })

  const headers = source.headers as Headers & {
    getSetCookie?: () => string[]
  }
  const cookies = headers.getSetCookie?.() ?? []
  const fallback = source.headers.get("set-cookie")

  for (const cookie of cookies.length > 0 ? cookies : fallback ? [fallback] : []) {
    target.append("set-cookie", cookie)
  }
}

function resolveRedirectUrl(request: Request, value: string | undefined) {
  if (!value) {
    return null
  }

  try {
    const target = new URL(value, new URL(request.url).origin)

    if (!["http:", "https:"].includes(target.protocol)) {
      return null
    }

    return target
  } catch {
    return null
  }
}

async function getBetterAuthRedirectPayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? ""

  if (!contentType.includes("application/json")) {
    return null
  }

  try {
    const payload = (await response.clone().json()) as BetterAuthRedirectPayload
    return payload.redirect && payload.url ? payload : null
  } catch {
    return null
  }
}

async function createRedirectResponse(request: Request, response: Response) {
  const payload = await getBetterAuthRedirectPayload(response)
  const redirectUrl = resolveRedirectUrl(request, payload?.url)

  if (!redirectUrl) {
    return null
  }

  const headers = new Headers()
  appendResponseHeaders(headers, response)
  headers.set("Location", redirectUrl.toString())
  headers.set("Cache-Control", "no-store")
  headers.delete("content-type")
  headers.delete("content-length")

  return new Response(null, {
    status: 302,
    headers,
  })
}

async function proxyAuth(
  request: Request,
  context: { params: Promise<{ all?: string[] }> },
) {
  const params = await context.params
  const path = params.all?.join("/") ?? ""
  const requestUrl = new URL(request.url)
  const targetUrl = new URL(`/auth/${path}`, getServerBaseUrl())

  targetUrl.search = requestUrl.search

  let response: Response

  try {
    response = await fetch(targetUrl, {
      method: request.method,
      headers: copyRequestHeaders(request),
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.text(),
      redirect: "manual",
      cache: "no-store",
    })
  } catch {
    return Response.json(
      {
        error: "sso_server_unavailable",
        message: `Cannot connect to SSO server at ${getServerBaseUrl()}`,
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    )
  }

  const redirectResponse = await createRedirectResponse(request, response)

  if (redirectResponse) {
    return redirectResponse
  }

  const headers = new Headers()
  appendResponseHeaders(headers, response)

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export const GET = proxyAuth
export const POST = proxyAuth
export const PUT = proxyAuth
export const PATCH = proxyAuth
export const DELETE = proxyAuth
