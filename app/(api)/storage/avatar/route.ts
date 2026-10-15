import { NextResponse } from "next/server"
import { HTTPException } from "hono/http-exception"
import { isAPIError } from "better-auth/api"
import { auth } from "@/lib/auth/server/index"
import { getNoStoreHeaders } from "@/utils/client/formatter"
import { matchesAvatarSignature } from "@/utils/server/formatter"
import { uploadAvatar } from "@/services/media"

const maxImageSize = 2_097_152
const allowedImageTypes = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
])
export const runtime = "nodejs"

async function readBoundedFormData(request: Request) {
  if (!request.body)
    throw new HTTPException(400, { message: "missing_image_body" })
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > maxImageSize + 65_536) {
        await reader.cancel()
        throw new HTTPException(413, { message: "image_too_large" })
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  return new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body: Buffer.concat(chunks),
  }).formData()
}

export async function POST(request: Request) {
  // Cookie-authenticated mutation must be same-origin, even for a valid session.
  if (
    request.headers.get("origin") !== new URL(request.url).origin ||
    ["cross-site", "same-site"].includes(
      request.headers.get("sec-fetch-site") ?? ""
    )
  ) {
    return NextResponse.json(
      { error: "forbidden_origin" },
      { status: 403, headers: getNoStoreHeaders() }
    )
  }
  const declaredSize = Number(request.headers.get("content-length"))
  if (declaredSize > maxImageSize + 65_536)
    return NextResponse.json({ error: "image_too_large" }, { status: 413 })
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
      query: { disableCookieCache: true },
    })
    if (!session?.user)
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401, headers: getNoStoreHeaders() }
      )
    const formData = await readBoundedFormData(request)
    const file = formData.get("file")
    if (!(file instanceof File))
      return NextResponse.json(
        { error: "An image file is required." },
        { status: 400 }
      )
    if (!allowedImageTypes.has(file.type))
      return NextResponse.json(
        { error: "Only JPG, JPEG, PNG, GIF, and WebP images are allowed." },
        { status: 415 }
      )
    if (file.size <= 0 || file.size > maxImageSize)
      return NextResponse.json(
        { error: "The image must be no larger than 2048 KB." },
        { status: 413 }
      )
    if (
      !matchesAvatarSignature(
        new Uint8Array(await file.arrayBuffer()),
        file.type
      )
    ) {
      return NextResponse.json(
        { error: "Invalid image content." },
        { status: 415 }
      )
    }
    return NextResponse.json(
      await uploadAvatar(file, session.user.id, request.headers),
      { headers: getNoStoreHeaders() }
    )
  } catch (cause) {
    if (isAPIError(cause)) {
      const status = cause.statusCode
      return NextResponse.json(
        {
          error:
            status === 401
              ? "unauthorized"
              : status === 403
                ? "forbidden"
                : "media_auth_unavailable",
        },
        { status, headers: getNoStoreHeaders() }
      )
    }
    const status = cause instanceof HTTPException ? cause.status : 502
    const error =
      cause instanceof HTTPException ? cause.message : "avatar_upload_failed"
    return NextResponse.json(
      { error },
      { status, headers: getNoStoreHeaders() }
    )
  }
}
