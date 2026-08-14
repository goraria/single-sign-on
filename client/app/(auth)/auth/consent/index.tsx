"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { auth } from "@/lib/auth"

export default function ConsentPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clientId = searchParams.get("client_id") ?? "application"
  const scope = searchParams.get("scope") ?? "openid profile email"
  const scopes = useMemo(
    () => scope.split(" ").map((item) => item.trim()).filter(Boolean),
    [scope],
  )

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
      setError(cause instanceof Error ? cause.message : "Unable to complete OAuth consent")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <section className="space-y-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-neutral-950">Authorize access</h1>
          <p className="text-sm text-neutral-600">
            {clientId} is requesting access to your Gorth account.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-900">Requested scopes</p>
          <ul className="space-y-1 text-sm text-neutral-700">
            {scopes.map((item) => (
              <li key={item} className="rounded-md bg-neutral-100 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <div className="flex gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => submitConsent(false)}
            className="flex-1 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Deny
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => submitConsent(true)}
            className="flex-1 rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Allow
          </button>
        </div>
      </section>
    </main>
  )
}
