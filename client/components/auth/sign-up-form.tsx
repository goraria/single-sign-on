"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "@gorth/primitive/cores/tanstack/form"
import { Loader2, UserPlus } from "@gorth/primitive/cores/lucide"

import { FieldError } from "@/components/auth/field-error"
import { PasswordInput } from "@/components/auth/password-input"
import { SocialForm } from "@/components/auth/social-form"
import { auth } from "@/lib/auth"
import {
  continueOAuthRegistration,
  isOAuthRegistrationSession,
} from "@/lib/auth/oauth-registration"
import { setPendingVerification } from "@/lib/auth/pending-verification"
import { sanitizeUsernameInput } from "@/lib/utils/formatter"
import { signUpSchema } from "@/schemas/auth"
import {
  buildLegacyDisabledPath,
  hasOAuthQuery,
  isExternalRedirect,
} from "@/lib/utils/temp"
import { Button } from "@gorth/primitive/custom/button"
import { Input } from "@gorth/primitive/default/input"
import { Label } from "@gorth/primitive/default/label"

export function SignUpForm() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") ?? "/"
  const oauthQueryString = searchParams.toString()
  const oauthQuery = new URLSearchParams(oauthQueryString)
  const isOAuthFlow = hasOAuthQuery(oauthQuery)
  const { data: session } = auth.useSession()
  const canResume = isOAuthRegistrationSession(
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
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validators: { onChange: signUpSchema },
    onSubmit: async ({ value }) => {
      setSubmitError(null)
      try {
        const result = await auth.signUp.email({
          name: `${value.firstName.trim()} ${value.lastName.trim()}`,
          firstName: value.firstName.trim(),
          lastName: value.lastName.trim(),
          username: value.username.trim(),
          email: value.email.trim(),
          password: value.password,
          ...(isOAuthFlow
            ? {}
            : {
                callbackURL: isExternalRedirect(redirect)
                  ? buildLegacyDisabledPath()
                  : "/",
              }),
        } as Parameters<typeof auth.signUp.email>[0] & {
          firstName: string
          lastName: string
          username: string
        })
        if (result.error) {
          setSubmitError(result.error.message ?? "Sign up failed")
          return
        }

        setPendingVerification({
          email: value.email,
          type: "email-verification",
          source: "sign-up",
          redirect,
          oauthQuery: isOAuthFlow ? oauthQueryString : "",
        })
        router.replace("/auth/verify")
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
      <div className="grid grid-cols-2 gap-4">
        <form.Field name="firstName">
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>First name</Label>
              <Input
                id={field.name}
                name={field.name}
                autoComplete="given-name"
                placeholder="Alex"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
        <form.Field name="lastName">
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Last name</Label>
              <Input
                id={field.name}
                name={field.name}
                autoComplete="family-name"
                placeholder="Morgan"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
      </div>
      <form.Field name="username">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Username</Label>
            <Input
              autoCapitalize="none"
              autoCorrect="off"
              id={field.name}
              name={field.name}
              autoComplete="username"
              inputMode="text"
              maxLength={32}
              minLength={5}
              pattern="[a-z0-9._]+"
              placeholder="alex.morgan"
              spellCheck={false}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) =>
                field.handleChange(sanitizeUsernameInput(event.target.value))
              }
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>
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
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Password</Label>
            <PasswordInput
              id={field.name}
              name={field.name}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>
      <form.Field name="confirmPassword">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Confirm Password</Label>
            <PasswordInput
              id={field.name}
              name={field.name}
              autoComplete="new-password"
              placeholder="Enter your password again"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            <FieldError errors={field.state.meta.errors} />
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
            className="mt-1 w-full"
            type="submit"
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <UserPlus />}
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        )}
      </form.Subscribe>
      <SocialForm />
    </form>
  )
}
