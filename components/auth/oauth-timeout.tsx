"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { prepareOAuthTimeout } from "@/services/client/browser-account"
import { scheduleOAuthTimeout } from "@/lib/auth/client/timeout"

export function OAuthTimeout() {
  const query = useSearchParams().toString()
  const [errorQuery, setErrorQuery] = useState<string | null>(null)
  useEffect(() => {
    const params = new URLSearchParams(query)
    if (!params.has("sig") || !params.has("client_id")) return
    const controller = new AbortController()
    let schedule: ReturnType<typeof scheduleOAuthTimeout> | undefined
    const check = () => schedule?.check()
    void prepareOAuthTimeout(query, controller.signal)
      .then((timeout) => {
        if (controller.signal.aborted) return
        schedule = scheduleOAuthTimeout(timeout, (url) =>
          window.location.replace(url)
        )
      })
      .catch(() => {
        if (!controller.signal.aborted) setErrorQuery(query)
      })
    window.addEventListener("pageshow", check)
    document.addEventListener("visibilitychange", check)
    return () => {
      controller.abort()
      schedule?.stop()
      window.removeEventListener("pageshow", check)
      document.removeEventListener("visibilitychange", check)
    }
  }, [query])
  return errorQuery === query ? (
    <p role="alert" className="mb-4 text-sm text-destructive">
      This sign-in request is invalid or expired. Return to the app and try
      again.
    </p>
  ) : null
}
