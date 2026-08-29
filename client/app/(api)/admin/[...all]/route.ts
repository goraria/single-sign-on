import { getNoStoreHeaders } from "@/lib/utils/formatter"
import { forwardAdminRoute } from "@/services/route"

export const runtime = "nodejs"

interface AdminProxyContext {
  params: Promise<{ all?: string[] }>
}

async function handleAdminProxy(
  request: Request,
  context: AdminProxyContext
) {
  const { all = [] } = await context.params
  const [namespace, ...path] = all

  if (namespace !== "gateway" || !path.length) {
    return Response.json(
      { error: "admin_proxy_route_not_found" },
      { status: 404, headers: getNoStoreHeaders() }
    )
  }

  const body = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await request.text()

  try {
    return await forwardAdminRoute({
      path,
      requestUrl: new URL(request.url),
      method: request.method,
      headers: request.headers,
      body,
    })
  } catch {
    return Response.json(
      {
        error: "sso_server_unavailable",
        message: "The SSO admin service is unavailable.",
      },
      { status: 503, headers: getNoStoreHeaders() }
    )
  }
}

export const GET = handleAdminProxy
export const POST = handleAdminProxy
export const PATCH = handleAdminProxy
export const DELETE = handleAdminProxy
