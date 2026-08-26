"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "@gorth/primitive/cores/tanstack/form"
import { Loader2, LogIn } from "@gorth/primitive/cores/lucide"

import { AuthFieldError } from "@/components/auth/auth-field-error"
import { PasswordInput } from "@/components/auth/password-input"
import { SocialForm } from "@/components/auth/social-form"
import { auth } from "@/lib/auth"
import { signInSchema } from "@/schemas/auth"
import {
  buildLegacyDisabledPath,
  buildOAuthAuthorizePath,
  hasOAuthQuery,
  isExternalRedirect,
} from "@/lib/utils/temp"
import { Button } from "@gorth/primitive/custom/button"
import { Input } from "@gorth/primitive/default/input"
import { Label } from "@gorth/primitive/default/label"

export function LoginForm() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") ?? "/"
  const oauthQueryString = searchParams.toString()
  const { data: session } = auth.useSession()

  useEffect(() => {
    if (!session?.user) return
    const oauthQuery = new URLSearchParams(oauthQueryString)
    if (hasOAuthQuery(oauthQuery))
      window.location.replace(buildOAuthAuthorizePath(oauthQuery))
    else if (isExternalRedirect(redirect))
      window.location.replace(buildLegacyDisabledPath())
    else router.replace(redirect)
  }, [oauthQueryString, redirect, router, session?.user])

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onChange: signInSchema },
    onSubmit: async ({ value }) => {
      setSubmitError(null)
      try {
        const result = await auth.signIn.email({ ...value, rememberMe: true })
        if (result.error) {
          setSubmitError(result.error.message ?? "Login failed")
          return
        }
        const oauthQuery = new URLSearchParams(oauthQueryString)
        if (hasOAuthQuery(oauthQuery))
          window.location.assign(buildOAuthAuthorizePath(oauthQuery))
        else if (isExternalRedirect(redirect))
          window.location.assign(buildLegacyDisabledPath())
        else router.push(redirect)
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
              name={field.name}
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
          <div className="relative grid gap-2">
            <Label htmlFor={field.name}>Password</Label>
            <PasswordInput
              id={field.name}
              name={field.name}
              autoComplete="current-password"
              placeholder="********"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            <AuthFieldError errors={field.state.meta.errors} />
            <Link
              href="/auth/forgot-password"
              className="text-muted-foreground absolute inset-e-0 -top-0.5 text-sm font-medium hover:opacity-75"
            >
              Forgot password?
            </Link>
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
            className="mt-2 w-full"
            type="submit"
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <LogIn />}{" "}
            Sign in
          </Button>
        )}
      </form.Subscribe>
      <SocialForm />
    </form>
  )
}
