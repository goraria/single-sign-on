import { auth } from "@/lib/auth"

export async function continueOAuthRegistration(oauthQuery: string) {
  const result = await auth.oauth2.continue({
    created: true,
    oauth_query: oauthQuery,
  })

  if (result.error) {
    throw new Error(result.error.message ?? "Unable to continue OAuth sign up")
  }

  const data = result.data as { redirect_uri?: string; url?: string } | null
  const redirectUrl = data?.url ?? data?.redirect_uri

  if (!redirectUrl) {
    throw new Error("OAuth sign up did not return a redirect URL")
  }

  window.location.assign(redirectUrl)
}

export function isOAuthRegistrationSession(
  createdAt: Date | string | undefined,
  issuedAt: string | null
) {
  if (!createdAt || !issuedAt) return false

  const created = new Date(createdAt).getTime()
  const issued = Number(issuedAt)

  return (
    Number.isFinite(created) && Number.isFinite(issued) && created >= issued
  )
}
