"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { auth, registrationAuth } from "@/lib/auth"
import { Button } from "@gorth/primitive/default/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gorth/primitive/default/card"
import { Input } from "@gorth/primitive/default/input"
import { Label } from "@gorth/primitive/default/label"
import { SocialForm } from "@/components/auth/social-form"
import {
  buildLegacyDisabledPath,
  hasOAuthQuery,
  isExternalRedirect,
} from "@/lib/utils/temp"

async function continueOAuthRegistration(oauthQuery: string) {
  const result = await auth.oauth2.continue({
    created: true,
    oauth_query: oauthQuery,
  })

  if (result.error) {
    throw new Error(result.error.message ?? "Unable to continue OAuth sign up")
  }

  const data = result.data as {
    redirect?: boolean
    redirect_uri?: string
    url?: string
  } | null
  const redirectUrl = data?.url ?? data?.redirect_uri

  if (!redirectUrl) {
    throw new Error("OAuth sign up did not return a redirect URL")
  }

  window.location.assign(redirectUrl)
}

function sessionWasCreatedForOAuthSignUp(
  createdAt: Date | string | undefined,
  issuedAt: string | null
) {
  if (!createdAt || !issuedAt) return false

  const sessionCreatedAt = new Date(createdAt).getTime()
  const oauthIssuedAt = Number(issuedAt)

  return (
    Number.isFinite(sessionCreatedAt) &&
    Number.isFinite(oauthIssuedAt) &&
    sessionCreatedAt >= oauthIssuedAt
  )
}

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("redirect") as string
  const { data: session } = auth.useSession()
  const oauthQueryString = searchParams.toString()
  const oauthQuery = new URLSearchParams(oauthQueryString)
  const isOAuthFlow = hasOAuthQuery(oauthQuery)
  const canResumeOAuthSignUp = sessionWasCreatedForOAuthSignUp(
    session?.session.createdAt,
    oauthQuery.get("ba_iat")
  )
  const continueInFlight = useRef(false)

  const continueOAuthSignUp = useCallback(async () => {
    if (!isOAuthFlow || continueInFlight.current) return

    continueInFlight.current = true

    try {
      await continueOAuthRegistration(oauthQueryString)
    } catch (cause) {
      continueInFlight.current = false
      throw cause
    }
  }, [isOAuthFlow, oauthQueryString])

  useEffect(() => {
    if (!session?.user) {
      return
    }

    if (isOAuthFlow) {
      if (canResumeOAuthSignUp) {
        void continueOAuthSignUp().catch((cause: unknown) => {
          setIsLoading(false)
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to continue OAuth sign up"
          )
        })
      }
      return
    }

    if (isExternalRedirect(next)) {
      window.location.replace(buildLegacyDisabledPath())
      return
    }

    router.replace("/")
  }, [
    canResumeOAuthSignUp,
    continueOAuthSignUp,
    isOAuthFlow,
    next,
    router,
    session?.user,
  ])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await registrationAuth.signUp.email({
        name: name.trim() || email.split("@")[0],
        email,
        password,
        ...(isOAuthFlow
          ? {}
          : {
              callbackURL: isExternalRedirect(next)
                ? buildLegacyDisabledPath()
                : "/",
            }),
      })
      if (error) {
        setError(error.message ?? "Sign up failed")
        return
      }

      if (isOAuthFlow) {
        await continueOAuthSignUp()
        return
      }

      router.push(
        isExternalRedirect(next) ? buildLegacyDisabledPath() : "/auth/success"
      )
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">Repeat Password</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating an account..." : "Sign up"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link
                href={`/auth/sign-in?redirect=${encodeURIComponent(next)}`}
                className="underline underline-offset-4"
              >
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
      <SocialForm />
    </div>
  )
}
