import {
  ssoClientInternalSecret,
  ssoServerUrl,
} from "@/lib/utils/environment"
import {
  appendResponseCookies,
  copyUrlSearch,
  getNoStoreHeaders,
  getRequestParameter,
  parseHttpUrl,
  readJsonObject,
  requireUrl,
} from "@/lib/utils/formatter"
import { forwardAuthRoute } from "@/services/route"

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
  return requireUrl(ssoServerUrl, "NEXT_SSO_SERVER_URL")
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

  const internalSecret = ssoClientInternalSecret
  if (internalSecret) headers.set("x-sso-client-secret", internalSecret)

  return headers
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

  const cookieCount = appendResponseCookies(headers, source, true)
  headers.set("x-gorth-auth-set-cookie-count", String(cookieCount))
  return headers
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
    { status: 503, headers: getNoStoreHeaders() }
  )
}

interface BrowserRedirectRoute {
  methods: readonly string[]
  parameter?: "redirect_uri" | "post_logout_redirect_uri"
  trustsServerRedirect?: boolean
}

const browserRedirectRoutes: Record<string, BrowserRedirectRoute> = {
  "oauth2/authorize": {
    methods: ["GET", "POST"],
    parameter: "redirect_uri",
  },
  "oauth2/end-session": {
    methods: ["GET", "POST"],
    parameter: "post_logout_redirect_uri",
  },
  "oauth2/end-session/confirm": {
    methods: ["POST"],
    trustsServerRedirect: true,
  },
}

async function getAuthRedirect(
  request: Request,
  path: string,
  requestBody: string | undefined,
  upstream: Response
) {
  const route = browserRedirectRoutes[path]

  if (
    !route?.methods.includes(request.method) ||
    !upstream.ok ||
    !upstream.headers.get("content-type")?.includes("application/json")
  ) {
    return null
  }

  const payload = await readJsonObject(upstream.clone())

  if (
    !payload ||
    !("redirect" in payload) ||
    payload.redirect !== true ||
    !("url" in payload) ||
    typeof payload.url !== "string"
  ) {
    return null
  }

  const requestUrl = new URL(request.url)
  const redirectUrl = parseHttpUrl(payload.url, requestUrl.origin)
  if (!redirectUrl) return null

  const serverOrigin = getServerBaseUrl().origin

  if (redirectUrl.origin === serverOrigin) {
    redirectUrl.protocol = requestUrl.protocol
    redirectUrl.host = requestUrl.host
  }

  const callbackValue = route.parameter
    ? getRequestParameter(request, requestBody, route.parameter)
    : null
  let isRegisteredCallback = false

  if (callbackValue) {
    const callbackUrl = parseHttpUrl(callbackValue)

    if (callbackUrl) {
      isRegisteredCallback =
        redirectUrl.origin === callbackUrl.origin &&
        redirectUrl.pathname === callbackUrl.pathname
    }
  }

  if (
    redirectUrl.origin !== requestUrl.origin &&
    !isRegisteredCallback &&
    !route.trustsServerRedirect
  ) {
    return null
  }

  const headers = copyResponseHeaders(upstream)
  headers.set("Location", redirectUrl.toString())
  headers.set("Cache-Control", "no-store")
  headers.delete("Content-Type")

  return new Response(null, { status: 302, headers })
}

export async function handleAuthProxy(
  request: Request,
  context: AuthProxyContext
) {
  const { all = [] } = await context.params
  const path = all.join("/")
  const requestUrl = new URL(request.url)
  const targetUrl = copyUrlSearch(
    requestUrl,
    new URL(`/auth/${path}`, getServerBaseUrl())
  )
  const requestBody = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await request.text()

  let upstream: Response

  try {
    upstream = await forwardAuthRoute({
      url: targetUrl,
      method: request.method,
      headers: copyRequestHeaders(request),
      body: requestBody,
    })
  } catch {
    return unavailableResponse()
  }

  const authRedirect = await getAuthRedirect(
    request,
    path,
    requestBody,
    upstream
  )

  if (authRedirect) {
    return logProxyResponse(request, path, authRedirect)
  }

  const headers = copyResponseHeaders(upstream)
  const response = new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  })

  return logProxyResponse(request, path, response)
}
