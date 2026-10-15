import { HTTPException } from "hono/http-exception"
import { isAPIError } from "better-auth/api"
import { isInsufficientScopeError } from "better-auth/oauth2"
import { requireMediaStorageClient } from "@/lib/auth/server/storage-access"
import { getStorageCredential } from "@/services/storage-credential"
import { storageCredentialRequestSchema } from "@/schemas/storage-credential"

export const runtime = "nodejs"
const headers = {
  "Cache-Control": "no-store, private",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
}

export async function POST(request: Request) {
  try {
    await requireMediaStorageClient()(request)
    // Small JSON only. Never log request headers or the returned credentials.
    if (
      !request.headers.get("content-type")?.includes("application/json") ||
      !request.body
    ) {
      return Response.json(
        { error: "invalid_request" },
        { status: 400, headers }
      )
    }
    const reader = request.body.getReader()
    const chunks: Uint8Array[] = []
    let size = 0
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > 1024) {
          await reader.cancel()
          return Response.json(
            { error: "request_too_large" },
            { status: 413, headers }
          )
        }
        chunks.push(value)
      }
    } finally {
      reader.releaseLock()
    }
    let body: unknown
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8"))
    } catch {
      return Response.json(
        { error: "invalid_request" },
        { status: 400, headers }
      )
    }
    const input = storageCredentialRequestSchema.safeParse(body)
    if (!input.success)
      return Response.json(
        { error: "invalid_request" },
        { status: 400, headers }
      )
    return Response.json(getStorageCredential(input.data.bucketName), {
      headers,
    })
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : ""
    const status =
      error instanceof HTTPException
        ? error.status
        : isInsufficientScopeError(error)
          ? 403
          : isAPIError(error)
            ? error.statusCode
            : /^(ERR_JWT|ERR_JWS|ERR_JOSE|ERR_JWKS_NO_MATCHING_KEY)/.test(code)
              ? 401
              : 503
    return Response.json(
      {
        error:
          status === 401
            ? "unauthorized"
            : status === 403
              ? "forbidden"
              : "storage_unavailable",
      },
      {
        status,
        headers: {
          ...headers,
          ...(status === 401
            ? { "WWW-Authenticate": 'Bearer error="invalid_token"' }
            : {}),
        },
      }
    )
  }
}
