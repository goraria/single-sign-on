"use client"

import React, { useState } from "react"
import { useSearchParams } from "next/navigation"

import { cn } from "@gorth/primitive/lib/utils"
import { auth } from "@/lib/auth"
import { resolveInternalPath } from "@/lib/utils/formatter"
import {
  buildLegacyDisabledPath,
  buildOAuthAuthorizePath,
  hasOAuthQuery,
  isExternalRedirect,
} from "@/lib/utils/temp"
import { Button } from "@gorth/primitive/custom/button"

export function SocialForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const next = searchParams.get("redirect") ?? "/"
  const oauthQuery = new URLSearchParams(searchParams.toString())
  const getCallbackURL = () => {
    if (hasOAuthQuery(oauthQuery)) {
      return new URL(
        buildOAuthAuthorizePath(oauthQuery),
        window.location.origin
      ).toString()
    }

    if (isExternalRedirect(next)) {
      return new URL(buildLegacyDisabledPath(), window.location.origin).toString()
    }

    return new URL(resolveInternalPath(next), window.location.origin).toString()
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
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          className="w-full"
          variant="outline"
          disabled={isLoading}
          onClick={() => void handleSocialLogin()}
        >
          {isLoading ? "Redirecting..." : "Continue with Google"}
        </Button>
      </div>
    </div>
  )
}
