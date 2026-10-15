import { HTTPException } from "hono/http-exception"
import { isAPIError } from "better-auth/api"
import { registerMediaStorageClient } from "@/services/media-client-registration"

export const runtime = "nodejs"
const headers = { "Cache-Control": "no-store, private", Pragma: "no-cache" }

export async function POST(request: Request) {
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
    return Response.json(await registerMediaStorageClient(request.headers), {
      status: 201,
      headers,
    })
  } catch (error) {
    const status =
      error instanceof HTTPException
        ? error.status
        : isAPIError(error)
          ? error.statusCode
          : 503
    return Response.json(
      {
        error:
          status === 409
            ? "media_client_already_registered"
            : status === 401
              ? "unauthorized"
              : status === 403
                ? "forbidden"
                : "media_client_registration_failed",
      },
      { status, headers }
    )
  }
}
