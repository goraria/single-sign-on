import { APIError, createAuthMiddleware } from "better-auth/api"

// Applies to native server APIs and HTTP registration; public PKCE clients stay public.
export const basicClientRegistration = createAuthMiddleware(async (context) => {
  if (!["/admin/oauth2/create-client", "/oauth2/create-client", "/oauth2/register"].includes(context.path)) return
  const method = context.body?.token_endpoint_auth_method
  if (method !== undefined && method !== "none" && method !== "client_secret_basic")
    throw new APIError("BAD_REQUEST", {
      error: "invalid_client_metadata",
      error_description: "Confidential clients must use client_secret_basic",
    })
})
