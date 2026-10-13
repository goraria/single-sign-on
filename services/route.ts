import "server-only"
import { auth } from "@/lib/auth/server/index"
import { fetchApi } from "@/lib/hono"
import { isOAuthClientRedirectAllowed } from "@/services/oauth-client"
import { appUrl } from "@/utils/environment"
import { fetcher, toWebResponse } from "@/utils/fetcher"
import { encodePathSegments, requireUrl } from "@/utils/client/formatter"

export interface RouteSession {
  user?: {
    id?: string
    role?: string
  }
}

export interface AvatarUploadRequest {
  url: string
  bucket: string
  path: string
  secretKey: string
  file: File
}

export interface SignOutRouteRequest {
  cookie?: string | null
  origin: string
}

export interface OAuthRedirectPolicyRequest {
  url: string
  purpose: "origin" | "post_logout"
}

export interface ForwardAdminRouteRequest {
  path: readonly string[]
  requestUrl: URL
  method: string
  headers: Headers
  body?: string
}

function getSsoServerBaseUrl() {
  return requireUrl(appUrl, "NEXT_PUBLIC_APP_URL")
}

export async function getRouteSession(cookie: string) {
  return auth.api.getSession({
    headers: new Headers({ Cookie: cookie }),
    query: { disableCookieCache: true },
  })
}

export async function uploadRouteAvatar({
  url,
  bucket,
  path,
  secretKey,
  file,
}: AvatarUploadRequest) {
  const encodedBucket = encodeURIComponent(bucket)
  const encodedPath = encodePathSegments(path)
  const response = await fetcher<unknown, ArrayBuffer>({
    url: `${url}/storage/v1/object/${encodedBucket}/${encodedPath}`,
    method: "POST",
    body: await file.arrayBuffer(),
    headers: {
      apikey: secretKey,
      "Content-Type": file.type,
      "x-upsert": "false",
      ...(secretKey.startsWith("eyJ")
        ? { Authorization: `Bearer ${secretKey}` }
        : {}),
    },
    validateStatus: () => true,
  })

  return {
    encodedBucket,
    encodedPath,
    response: toWebResponse(response),
  }
}

export async function signOutRouteSession({
  cookie,
  origin,
}: SignOutRouteRequest) {
  return auth.handler(
    new Request(new URL("/auth/sign-out", getSsoServerBaseUrl()), {
      method: "POST",
      headers: {
        Cookie: cookie ?? "",
        Origin: origin,
        "Content-Type": "application/json",
      },
      body: "{}",
    })
  )
}

export async function validateOAuthRedirectPolicy(
  body: OAuthRedirectPolicyRequest
) {
  return isOAuthClientRedirectAllowed(body.url, body.purpose)
}

export async function forwardAdminRoute({
  path,
  requestUrl,
  method,
  headers,
  body,
}: ForwardAdminRouteRequest) {
  const url = new URL(
    "/admin/" + path.map(encodeURIComponent).join("/"),
    getSsoServerBaseUrl()
  )
  url.search = requestUrl.search
  return fetchApi(new Request(url, { method, headers, body }))
}
