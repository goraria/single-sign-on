import { requireCommerceUser } from "@/lib/auth/server/commerce-access"
import { getCommerceAuthorization } from "@/services/commerce-access"
import { HTTPException } from "hono/http-exception"
import { isInsufficientScopeError } from "better-auth/oauth2"
export const runtime = "nodejs"
const headers = {
  "Cache-Control": "no-store, private",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
}
export async function GET(request: Request) {
  try {
    const actor = await requireCommerceUser(request)
    return Response.json(
      await getCommerceAuthorization(actor.subject, actor.resource),
      { headers },
    )
  } catch (error) {
    const code = (error as { code?: string })?.code ?? ""
    const status =
      error instanceof HTTPException
        ? error.status
        : isInsufficientScopeError(error)
          ? 403
          : /^(ERR_JWT|ERR_JWS|ERR_JOSE)/.test(code)
            ? 401
            : 503
    return Response.json(
      {
        error:
          status === 401
            ? "unauthorized"
            : status === 403
              ? "forbidden"
              : "commerce_authorization_unavailable",
      },
      { status, headers },
    )
  }
}
