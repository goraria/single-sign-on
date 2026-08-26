"use client"

import React, { useState } from "react"
import { useSearchParams } from "next/navigation"

import { cn } from "@gorth/primitive/lib/utils"
import { auth } from "@/lib/auth"
import { Button } from "@gorth/primitive/default/button"

export function SocialForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const next = searchParams.get("redirect") ?? "/"
  const oauthQuery = new URLSearchParams(searchParams.toString())
  const isOAuthFlow = Boolean(
    oauthQuery.get("client_id") &&
    oauthQuery.get("redirect_uri") &&
    oauthQuery.get("response_type")
  )
  const isExternalRedirect = () => {
    try {
      const target = new URL(next)
      return ["http:", "https:"].includes(target.protocol)
    } catch {
      return false
    }
  }
  const getCallbackURL = () => {
    if (isOAuthFlow) {
      return `${window.location.origin}/auth/oauth?${oauthQuery.toString()}`
    }

    if (isExternalRedirect()) {
      return `${window.location.origin}/auth/error?error=legacy_sso_issue_disabled`
    }

    return `${window.location.origin}/auth/oauth?next=${encodeURIComponent(next)}`
  }

  const handleSocialLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await auth.signIn.social({
        provider: "google",
        callbackURL: getCallbackURL(),
        errorCallbackURL: `${window.location.origin}/auth/error`,
      })

      if (error) {
        setError(error.message ?? "Google sign in failed")
        setIsLoading(false)
        return
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("grid gap-3", className)} {...props}>
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card text-muted-foreground px-2">
            Or continue with
          </span>
        </div>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="flex flex-col gap-6">
        <Button
          type="button"
          className="w-full"
          disabled={isLoading}
          onClick={() => void handleSocialLogin()}
        >
          {isLoading ? "Redirecting..." : "Google"}
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            type="button"
          // disabled={loadingProvider !== null}
          // onClick={() => void signIn("github")}
          >
            {/* <IconGithub /> */}
            GitHub
          </Button>
          <Button
            variant="outline"
            type="button"
          // disabled={loadingProvider !== null}
          // onClick={() => void signIn("facebook")}
          >
            {/* <IconFacebook /> */}
            Facebook
          </Button>
        </div>
      </div>
    </div>
  )
}
