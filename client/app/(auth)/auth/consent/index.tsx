"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"

import { AuthLayout } from "@/layouts/auth"
import { auth } from "@/lib/auth"
import { parseSpaceSeparatedValues } from "@/lib/utils/formatter"
import { Button } from "@gorth/primitive/custom/button"

export default function ConsentPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clientId = searchParams.get("client_id") ?? "application"
  const scope = searchParams.get("scope") ?? "openid profile email"
  const scopes = useMemo(() => parseSpaceSeparatedValues(scope), [scope])

  async function submitConsent(accept: boolean) {
    setLoading(true)
    setError(null)

    try {
      const result = await auth.oauth2.consent({
        accept,
        scope,
        oauth_query: searchParams.toString(),
      })

      if (result.error) {
        setError(result.error.message ?? "Unable to complete OAuth consent")
        return
      }

      const data = result.data as { redirect_uri?: string } | null

      if (data?.redirect_uri) {
        window.location.assign(data.redirect_uri)
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to complete OAuth consent"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Authorize access"
      description={`${clientId} is requesting access to your Gorth account.`}
    >
      <div className="grid gap-6">
        <div className="grid gap-2">
          <p className="text-sm font-medium">Requested permissions</p>
          <ul className="grid gap-2 text-sm">
            {scopes.map((item) => (
              <li key={item} className="bg-muted rounded-md px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            disabled={loading}
            onClick={() => submitConsent(false)}
            variant="outline"
          >
            Deny
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={() => submitConsent(true)}
          >
            {loading ? "Authorizing..." : "Allow"}
          </Button>
        </div>
      </div>
    </AuthLayout>
  )
}
