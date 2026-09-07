import { NextResponse } from "next/server"
import {
  supabaseBucket,
  supabaseServiceRoleKey,
  supabaseUrl,
} from "@/lib/utils/environment"

import {
  getNoStoreHeaders,
  getResponseErrorMessage,
} from "@/lib/utils/formatter"
import { getSession } from "@/services/auth"
import { uploadRouteAvatar } from "@/services/route"

const extensionsByMimeType: Record<string, readonly string[]> = {
  "image/gif": ["gif"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
}

const maxImageSize = 2_048 * 1_024

interface AuthSession {
  user?: {
    id?: unknown
  }
}

function getStorageConfig() {
  const url = supabaseUrl
  const bucket = supabaseBucket
  const secretKey = supabaseServiceRoleKey

  if (!url || !bucket || !secretKey) {
    throw new Error("Supabase Storage server credentials are not configured.")
  }

  return { bucket, secretKey, url: url.replace(/\/$/, "") }
}

function getFileExtension(file: File) {
  const original = file.name.split(".").pop()?.toLowerCase() ?? ""
  const allowedExtensions = extensionsByMimeType[file.type] ?? []
  const fallbackExtension = allowedExtensions[0]

  if (!fallbackExtension) throw new Error("Unsupported image format.")

  return allowedExtensions.includes(original) ? original : fallbackExtension
}

export async function POST(request: Request) {
  try {
    const session = (await getSession()) as AuthSession | null
    const userId = session?.user?.id

    if (typeof userId !== "string" || !userId) {
      return NextResponse.json(
        { error: "Authentication is required." },
        { status: 401, headers: getNoStoreHeaders() }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "An image file is required." },
        { status: 400, headers: getNoStoreHeaders() }
      )
    }

    if (!Object.hasOwn(extensionsByMimeType, file.type)) {
      return NextResponse.json(
        { error: "Only JPG, JPEG, PNG, GIF, and WebP images are allowed." },
        { status: 415, headers: getNoStoreHeaders() }
      )
    }

    if (file.size > maxImageSize) {
      return NextResponse.json(
        { error: "The image must be no larger than 2048 KB." },
        { status: 413, headers: getNoStoreHeaders() }
      )
    }

    const { bucket, secretKey, url } = getStorageConfig()
    const path = `avatars/${userId}/${crypto.randomUUID()}.${getFileExtension(file)}`
    const { encodedBucket, encodedPath, response } = await uploadRouteAvatar({
      url,
      bucket,
      path,
      secretKey,
      file,
    })

    if (!response.ok) {
      return NextResponse.json(
        {
          error: await getResponseErrorMessage(
            response,
            "Unable to upload image."
          ),
        },
        { status: response.status, headers: getNoStoreHeaders() }
      )
    }

    return NextResponse.json(
      {
        path,
        url: `${url}/storage/v1/object/public/${encodedBucket}/${encodedPath}`,
      },
      { headers: getNoStoreHeaders() }
    )
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Unable to upload image."

    return NextResponse.json(
      { error: message },
      { status: 500, headers: getNoStoreHeaders() }
    )
  }
}
