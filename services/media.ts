import "server-only"
import { randomUUID } from "node:crypto"
import { auth } from "@/lib/auth/server/index"
import {
  appUrl,
  mediaAvatarBucketId,
  awsEndpointUrlS3,
} from "@/utils/environment"
import { fetcher } from "@/utils/fetcher"
import {
  mediaReadyAssetSchema,
  mediaUploadSchema,
  mediaAvatarUploadStateSchema,
} from "@/schemas/media"
import { createServiceError } from "@/services/helper"
import { HTTPException } from "hono/http-exception"
import axios from "@gorth/structure/cores/axios"

function configuration() {
  if (!mediaAvatarBucketId || !awsEndpointUrlS3 || !appUrl)
    throw createServiceError("media_upload_not_configured", 503)
  const upload = new URL(awsEndpointUrlS3)
  const application = new URL(appUrl)
  if (
    upload.protocol !== "https:" ||
    upload.username ||
    upload.password ||
    upload.search ||
    upload.hash ||
    upload.pathname !== "/"
  )
    throw createServiceError("invalid_media_configuration", 503)
  return {
    uploadOrigin: upload.origin,
    application,
    bucket: mediaAvatarBucketId,
  }
}

// Bearer is server-only. Identity is derived from the native SSO session;
// never forward browser-supplied identity, endpoints, secret references or cookies to Media.
export async function uploadAvatar(
  file: File,
  subject: string,
  headers: Headers
) {
  const config = configuration()
  const { token, resourceIdentifier } = await auth.api.issueMediaAccessToken({
    headers,
  })
  const server = new URL(resourceIdentifier)
  const authorization = { Authorization: `Bearer ${token}` }
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  }
  let uploadId: string | undefined
  try {
    const created = await fetcher({
      url: new URL("/media/upload", server),
      method: "POST",
      headers: authorization,
      timeout: 15_000,
      maxRedirects: 0,
      body: {
        bucket: config.bucket,
        filename: `avatar-${randomUUID()}.${extensions[file.type]}`,
        type: "image",
        contentType: file.type,
        size: file.size,
        visibility: "public",
        resourceType: "avatar",
        resourceId: subject,
        multipart: false,
        metadata: {},
      },
    })
    const { asset, upload } = mediaUploadSchema.parse(created.data)
    uploadId = upload.id
    const destination = new URL(upload.url)
    if (
      destination.origin !== config.uploadOrigin ||
      destination.username ||
      destination.password ||
      destination.hash
    )
      throw createServiceError("untrusted_storage_destination", 502)
    // Browser receives only a short-lived PUT capability, never an OAuth token or key.
    return {
      assetId: asset.id,
      uploadId: upload.id,
      uploadUrl: destination.href,
      contentType: file.type,
    }
  } catch (error) {
    // Axios errors contain Authorization and signed URLs. Never expose their text.
    const upstreamStatus = axios.isAxiosError(error)
      ? error.response?.status
      : undefined
    console.error("[avatar-upload-failed]", { phase: "create", upstreamStatus })
    if (uploadId) {
      try {
        await fetcher({
          url: new URL(`/media/upload/${uploadId}`, server),
          method: "DELETE",
          headers: authorization,
          timeout: 10_000,
          maxRedirects: 0,
        })
      } catch {
        console.error("[avatar-upload-cleanup]", { code: "cleanup_failed" })
      }
    }
    if (error instanceof HTTPException) throw error
    if (upstreamStatus === 503)
      throw createServiceError("media_upload_unavailable", 503)
    throw createServiceError("avatar_upload_failed", 502)
  }
}

export async function finishAvatarUpload(
  uploadId: string,
  subject: string,
  headers: Headers,
  abort = false
) {
  const config = configuration()
  const { token, resourceIdentifier } = await auth.api.issueMediaAccessToken({
    headers,
  })
  const base = new URL(resourceIdentifier)
  const authorization = { Authorization: `Bearer ${token}` }
  try {
    const current = await fetcher({
      url: new URL(`/media/upload/${uploadId}`, base),
      method: "GET",
      headers: authorization,
      timeout: 15_000,
      maxRedirects: 0,
    })
    const { asset } = mediaAvatarUploadStateSchema.parse(current.data)
    if (asset.resourceId !== subject || asset.bucketId !== config.bucket)
      throw createServiceError("forbidden_avatar_upload", 403)
    if (abort) {
      await fetcher({
        url: new URL(`/media/upload/${uploadId}`, base),
        method: "DELETE",
        headers: authorization,
        timeout: 15_000,
        maxRedirects: 0,
      })
      return null
    }
    const response = await fetcher({
      url: new URL(`/media/upload/${uploadId}/complete`, base),
      method: "POST",
      body: {},
      headers: authorization,
      timeout: 15_000,
      maxRedirects: 0,
    })
    const ready = mediaReadyAssetSchema.parse(response.data)
    if (ready.id !== asset.id)
      throw createServiceError("media_asset_mismatch", 502)
    return {
      assetId: ready.id,
      path: asset.objectKey,
      url: new URL(`/storage/avatar/${ready.id}`, config.application).href,
    }
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw createServiceError("avatar_upload_failed", 502)
  }
}
