"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "@gorth/primitive/cores/tanstack/form"
import { Loader2, UserPlus } from "@gorth/primitive/cores/lucide"

import { AuthFieldError } from "@/components/auth/auth-field-error"
import { PasswordInput } from "@/components/auth/password-input"
import { SocialForm } from "@/components/auth/social-form"
import { auth, registrationAuth } from "@/lib/auth"
import { signUpSchema } from "@/schemas/auth"
import {
  buildLegacyDisabledPath,
  hasOAuthQuery,
  isExternalRedirect,
} from "@/lib/utils/temp"
import { Button } from "@gorth/primitive/custom/button"
import { Input } from "@gorth/primitive/default/input"
import { Label } from "@gorth/primitive/default/label"

async function continueOAuthRegistration(oauthQuery: string) {
  const result = await auth.oauth2.continue({
    created: true,
    oauth_query: oauthQuery,
  })
  if (result.error)
    throw new Error(result.error.message ?? "Unable to continue OAuth sign up")
  const data = result.data as { redirect_uri?: string; url?: string } | null
  const redirectUrl = data?.url ?? data?.redirect_uri
  if (!redirectUrl)
    throw new Error("OAuth sign up did not return a redirect URL")
  window.location.assign(redirectUrl)
}

function isOAuthSession(
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

export function SignUpForm() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") ?? "/"
  const oauthQueryString = searchParams.toString()
  const oauthQuery = new URLSearchParams(oauthQueryString)
  const isOAuthFlow = hasOAuthQuery(oauthQuery)
  const { data: session } = auth.useSession()
  const canResume = isOAuthSession(
    session?.session.createdAt,
    oauthQuery.get("ba_iat")
  )
  const continueInFlight = useRef(false)

  const continueOAuth = useCallback(async () => {
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
    if (!session?.user) return
    if (isOAuthFlow) {
      if (canResume)
        void continueOAuth().catch((cause) =>
          setSubmitError(
            cause instanceof Error
              ? cause.message
              : "Unable to continue OAuth sign up"
          )
        )
      return
    }
    if (isExternalRedirect(redirect))
      window.location.replace(buildLegacyDisabledPath())
    else router.replace("/")
  }, [canResume, continueOAuth, isOAuthFlow, redirect, router, session?.user])

  const form = useForm({
    defaultValues: { email: "", password: "", confirmPassword: "" },
    validators: { onChange: signUpSchema },
    onSubmit: async ({ value }) => {
      setSubmitError(null)
      try {
        const result = await registrationAuth.signUp.email({
          name: value.email.split("@")[0],
          email: value.email,
          password: value.password,
          ...(isOAuthFlow
            ? {}
            : {
                callbackURL: isExternalRedirect(redirect)
                  ? buildLegacyDisabledPath()
                  : "/",
              }),
        })
        if (result.error) {
          setSubmitError(result.error.message ?? "Sign up failed")
          return
        }
        if (isOAuthFlow) await continueOAuth()
        else
          router.push(
            isExternalRedirect(redirect)
              ? buildLegacyDisabledPath()
              : "/auth/success"
          )
      } catch (cause) {
        setSubmitError(
          cause instanceof Error ? cause.message : "An error occurred"
        )
      }
    },
  })

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <form.Field name="email">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Email</Label>
            <Input
              id={field.name}
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            <AuthFieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>
      <form.Field name="password">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Password</Label>
            <PasswordInput
              id={field.name}
              autoComplete="new-password"
              placeholder="********"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            <AuthFieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>
      <form.Field name="confirmPassword">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Confirm Password</Label>
            <PasswordInput
              id={field.name}
              autoComplete="new-password"
              placeholder="********"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            <AuthFieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>
      {submitError && <p className="text-destructive text-sm">{submitError}</p>}
      <form.Subscribe
        selector={(state) =>
          [
            signUpSchema.safeParse(state.values).success,
            state.isSubmitting,
          ] as const
        }
      >
        {([isValid, isSubmitting]) => (
          <Button
            className="mt-2 w-full"
            type="submit"
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <UserPlus />}{" "}
            Create Account
          </Button>
        )}
      </form.Subscribe>
      <SocialForm />
    </form>
  )
}
