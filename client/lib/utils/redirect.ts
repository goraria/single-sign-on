import { parseHttpUrl } from "@/lib/utils/formatter"
import { validateOAuthRedirectPolicy } from "@/services/route"

export async function resolveRedirect(value: string | null, ownOrigin: string) {
  const target = parseHttpUrl(value)
  if (!target) return null

  if (
    target.origin !== ownOrigin &&
    !(await validateOAuthRedirectPolicy({
      url: target.toString(),
      purpose: "post_logout",
    }))
  ) {
    return null
  }

  return target.toString()
}

export async function getCorsHeaders(request: Request): Promise<HeadersInit> {
  const origin = request.headers.get("origin")

  if (!origin) {
    return {}
  }

  const requestOrigin = new URL(request.url).origin
  const isAllowed =
    origin === requestOrigin ||
    (await validateOAuthRedirectPolicy({ url: origin, purpose: "origin" }))

  if (!isAllowed) return {}

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  }
}
