// Called only after Better Auth verifies the provider-signed OAuth query.
export function oauthTimeoutResult(
  query: URLSearchParams,
  client: {
    disabled: boolean | null
    redirectUris: string[]
  },
  issuer: string,
  now = Date.now()
) {
  for (const key of [
    "client_id",
    "redirect_uri",
    "state",
    "exp",
    "ba_iat",
    "sig",
  ])
    if (query.getAll(key).length !== 1 || !query.get(key))
      throw new Error("invalid_oauth_query")
  const issuedAt = Number(query.get("ba_iat"))
  const expiresAt = Math.min(
    Number(query.get("exp")) * 1000,
    issuedAt + 120_000
  )
  const redirect = query.get("redirect_uri")!
  if (
    client.disabled ||
    !client.redirectUris.includes(redirect) ||
    !Number.isSafeInteger(issuedAt) ||
    issuedAt <= 0 ||
    issuedAt > now ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= now
  )
    throw new Error("invalid_oauth_query")
  const url = new URL(redirect)
  if (
    url.username ||
    url.password ||
    url.hash ||
    (url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      ))
  )
    throw new Error("invalid_redirect")
  // Current desktop callbacks use loopback HTTP, websites use HTTPS (or local HTTP).
  // Exact client registration, not a user-provided origin, authorizes this target.
  url.searchParams.delete("code")
  url.searchParams.set("error", "access_denied")
  url.searchParams.set("error_description", "Sign-in timed out")
  url.searchParams.set("state", query.get("state")!)
  url.searchParams.set("iss", issuer)
  return { url: url.href, expiresAt }
}
