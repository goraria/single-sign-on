import { HTTPException } from "hono/http-exception"
import { isAPIError } from "better-auth/api"
import { auth } from "@/lib/auth/server/index"
import { finishAvatarUpload } from "@/services/media"
import { mediaAssetIdSchema } from "@/schemas/media"

export const runtime = "nodejs"
const headers = { "Cache-Control": "no-store" }

async function handle(
  request: Request,
  context: { params: Promise<{ id: string }> },
  abort: boolean
) {
  if (
    request.headers.get("origin") !== new URL(request.url).origin ||
    ["same-site", "cross-site"].includes(
      request.headers.get("sec-fetch-site") ?? ""
    )
  ) {
    return Response.json(
      { error: "forbidden_origin" },
      { status: 403, headers }
    )
  }
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
      query: { disableCookieCache: true },
    })
    if (!session?.user)
      return Response.json({ error: "unauthorized" }, { status: 401, headers })
    const id = mediaAssetIdSchema.safeParse((await context.params).id)
    if (!id.success)
      return Response.json(
        { error: "invalid_upload_id" },
        { status: 400, headers }
      )
    const result = await finishAvatarUpload(
      id.data,
      session.user.id,
      request.headers,
      abort
    )
    return abort
      ? new Response(null, { status: 204, headers })
      : Response.json(result, { headers })
  } catch (error) {
    const status =
      error instanceof HTTPException
        ? error.status
        : isAPIError(error)
          ? error.statusCode
          : 502
    return Response.json(
      {
        error:
          status === 401
            ? "unauthorized"
            : status === 403
              ? "forbidden"
              : "avatar_upload_failed",
      },
      { status, headers }
    )
  }
}
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return handle(request, context, false)
}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return handle(request, context, true)
}
