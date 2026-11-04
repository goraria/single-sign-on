import { APIError } from "better-auth"
import { isInsufficientScopeError } from "better-auth/oauth2"
import { HTTPException } from "hono/http-exception"
import { ZodError } from "@gorth-io/structure/cores/zod"
import { executeCommerceOrganization } from "@/services/commerce-organization"
export const runtime = "nodejs"
const headers = { "Cache-Control": "no-store, private", Pragma: "no-cache", "X-Content-Type-Options": "nosniff" }
async function handle(request: Request, context: { params: Promise<{ operation: string }> }) {
  try {
    const { operation } = await context.params
    const input = request.method === "GET" ? Object.fromEntries(new URL(request.url).searchParams) : await request.json()
    return Response.json({ data: await executeCommerceOrganization(request, operation, input) }, { headers })
  } catch (error) {
    const code = (error as { code?: string })?.code ?? ""
    const status = error instanceof APIError ? error.statusCode : error instanceof HTTPException ? error.status : error instanceof ZodError || error instanceof SyntaxError ? 400 : isInsufficientScopeError(error) ? 403 : /^(ERR_JWT|ERR_JWS|ERR_JOSE)/.test(code) ? 401 : 503
    return Response.json({ error: error instanceof APIError ? error.body?.code ?? error.body?.message ?? "organization_request_failed" : status === 503 ? "organization_unavailable" : status === 401 ? "unauthorized" : status === 403 ? "forbidden" : "invalid_request" }, { status, headers })
  }
}
export { handle as GET, handle as POST }
