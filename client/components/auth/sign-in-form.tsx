"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "@gorth/primitive/cores/tanstack/form"
import { Loader2, LogIn } from "@gorth/primitive/cores/lucide"

import { FieldError } from "@/components/auth/field-error"
import { PasswordInput } from "@/components/auth/password-input"
import { SocialForm } from "@/components/auth/social-form"
import { auth } from "@/lib/auth"
import { setPendingVerification } from "@/lib/auth/pending-verification"
import { signInSchema } from "@/schemas/auth"
import {
  buildLegacyDisabledPath,
  buildOAuthAuthorizePath,
  hasOAuthQuery,
  isExternalRedirect,
} from "@/lib/utils/temp"
import { Button } from "@gorth/primitive/custom/button"
import { Checkbox } from "@gorth/primitive/default/checkbox"
import { Input } from "@gorth/primitive/default/input"
import { Label } from "@gorth/primitive/default/label"

export function LoginForm() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") ?? "/"
  const oauthQueryString = searchParams.toString()
  const { data: session } = auth.useSession()
  const navigationStarted = useRef(false)

  const continueAfterAuthentication = useCallback(
    (replace: boolean) => {
      if (navigationStarted.current) return
      navigationStarted.current = true

      const oauthQuery = new URLSearchParams(oauthQueryString)
      if (hasOAuthQuery(oauthQuery)) {
        const destination = buildOAuthAuthorizePath(oauthQuery)
        if (replace) window.location.replace(destination)
        else window.location.assign(destination)
        return
      }

      if (isExternalRedirect(redirect)) {
        const destination = buildLegacyDisabledPath()
        if (replace) window.location.replace(destination)
        else window.location.assign(destination)
        return
      }

      if (replace) router.replace(redirect)
      else router.push(redirect)
    },
    [oauthQueryString, redirect, router]
  )

  useEffect(() => {
    if (!session?.user) return
    continueAfterAuthentication(true)
  }, [continueAfterAuthentication, session?.user])

  const form = useForm({
    defaultValues: { email: "", password: "", rememberMe: true },
    validators: { onChange: signInSchema },
    onSubmit: async ({ value }) => {
      setSubmitError(null)
      try {
        const result = await auth.signIn.email({
          email: value.email.trim(),
          password: value.password,
          rememberMe: value.rememberMe,
        })
        if (result.error) {
          if (
            result.error.code === "EMAIL_NOT_VERIFIED" ||
            result.error.message === "Email not verified"
          ) {
            setPendingVerification({
              email: value.email,
              type: "email-verification",
              source: "sign-in",
              redirect,
              oauthQuery: oauthQueryString,
            })
            router.replace("/auth/verify")
            return
          }

          setSubmitError(result.error.message ?? "Login failed")
          return
        }
        continueAfterAuthentication(false)
      } catch (cause) {
        setSubmitError(
          cause instanceof Error ? cause.message : "An error occurred"
        )
      }
    },
  })

  return (
    <form
      className="grid gap-4"
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
              name={field.name}
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>
      <form.Field name="password">
        {(field) => (
          <div className="relative grid gap-2">
            <Label htmlFor={field.name}>Password</Label>
            <Link
              href="/auth/forgot-password"
              tabIndex={-1}
              className="text-muted-foreground hover:text-foreground absolute end-0 top-0.5 text-xs leading-none underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
            <PasswordInput
              id={field.name}
              name={field.name}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>
      <form.Field name="rememberMe">
        {(field) => (
          <div className="flex items-center gap-2">
            <Checkbox
              id={field.name}
              checked={field.state.value}
              onCheckedChange={(checked) =>
                field.handleChange(Boolean(checked))
              }
            />
            <Label htmlFor={field.name} className="font-normal">
              Remember me
            </Label>
          </div>
        )}
      </form.Field>
      {submitError && <p className="text-destructive text-sm">{submitError}</p>}
      <form.Subscribe
        selector={(state) =>
          [
            signInSchema.safeParse(state.values).success,
            state.isSubmitting,
          ] as const
        }
      >
        {([isValid, isSubmitting]) => (
          <Button
            className="mt-1 w-full"
            type="submit"
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <LogIn />}
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        )}
      </form.Subscribe>
      <SocialForm />
    </form>
  )
}
