"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "@gorth/primitive/cores/tanstack/form"
import { Loader2, UserPlus } from "@gorth/primitive/cores/lucide"

import { PasswordInput } from "@gorth/primitive/custom/input-password"
import { SocialForm } from "@/components/auth/social-form"
import { useAuth } from "@/hooks/use-auth"
import { auth } from "@/lib/auth/client"
import { getUsernameAvailabilityError } from "@/lib/auth/client/username"
import {
  continueOAuthRegistration,
  isOAuthRegistrationSession,
} from "@/lib/auth/client/registration"
import { setPendingVerification } from "@/lib/auth/client/pending-verification"
import {
  resolveInternalPath,
  sanitizeUsernameInput,
} from "@/utils/client/formatter"
import { defaultAuthRedirect } from "@/utils/constant"
import { signUpSchema } from "@/schemas/auth"
import {
  buildLegacyDisabledPath,
  hasOAuthQuery,
  isExternalRedirect,
} from "@/utils/client/temp"
import { Button } from "@gorth/primitive/custom/button"
import { StatusInput as Input } from "@gorth/primitive/custom/input-status"
import { Label } from "@gorth/primitive/default/label"

export function SignUpForm() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [usernameCheck, setUsernameCheck] = useState<{
    value: string
    error: string | undefined
  } | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") ?? defaultAuthRedirect
  const oauthQueryString = searchParams.toString()
  const oauthQuery = new URLSearchParams(oauthQueryString)
  const isOAuthFlow = hasOAuthQuery(oauthQuery)
  const { account, sessionCreatedAt } = useAuth()
  const canResume = isOAuthRegistrationSession(
    sessionCreatedAt ?? undefined,
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
    if (!account) return
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
    else router.replace(resolveInternalPath(redirect, defaultAuthRedirect))
  }, [account, canResume, continueOAuth, isOAuthFlow, redirect, router])

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
                  : resolveInternalPath(redirect, defaultAuthRedirect),
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
              <Label htmlFor={field.name}>
                First name{" "}
                <span aria-hidden="true" className="text-destructive">
                  *
                </span>
              </Label>
              <Input
                errors={field.state.meta.errors}
                checked={
                  field.state.meta.isBlurred && Boolean(field.state.value)
                }
                checking={field.state.meta.isValidating}
                onClear={() => field.handleChange("")}
                id={field.name}
                name={field.name}
                autoComplete="given-name"
                placeholder="Alex"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="lastName">
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>
                Last name{" "}
                <span aria-hidden="true" className="text-destructive">
                  *
                </span>
              </Label>
              <Input
                errors={field.state.meta.errors}
                checked={
                  field.state.meta.isBlurred && Boolean(field.state.value)
                }
                checking={field.state.meta.isValidating}
                onClear={() => field.handleChange("")}
                id={field.name}
                name={field.name}
                autoComplete="family-name"
                placeholder="Morgan"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
            </div>
          )}
        </form.Field>
      </div>
      <form.Field
        name="username"
        asyncDebounceMs={500}
        validators={{
          onChangeAsync: async ({ value, signal }) => {
            const error = await getUsernameAvailabilityError(value, signal)
            if (!signal.aborted) {
              setUsernameCheck({ value, error })
            }
            return error
          },
        }}
      >
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>
              Username{" "}
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </Label>
            <Input
              errors={
                usernameCheck?.value === field.state.value
                  ? [usernameCheck.error]
                  : []
              }
              checked={usernameCheck?.value === field.state.value}
              checking={field.state.meta.isValidating}
              onClear={() => {
                setUsernameCheck(null)
                field.handleChange("")
              }}
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
              onChange={(event) => {
                setUsernameCheck(null)
                field.handleChange(sanitizeUsernameInput(event.target.value))
              }}
            />
          </div>
        )}
      </form.Field>
      <form.Field name="email">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>
              Email{" "}
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </Label>
            <Input
              errors={field.state.meta.errors}
              checked={field.state.meta.isBlurred && Boolean(field.state.value)}
              checking={field.state.meta.isValidating}
              onClear={() => field.handleChange("")}
              id={field.name}
              name={field.name}
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
          </div>
        )}
      </form.Field>
      <form.Field name="password">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>
              Password{" "}
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </Label>
            <PasswordInput
              errors={field.state.meta.errors}
              checked={field.state.meta.isBlurred && Boolean(field.state.value)}
              checking={field.state.meta.isValidating}
              onClear={() => field.handleChange("")}
              id={field.name}
              name={field.name}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
          </div>
        )}
      </form.Field>
      <form.Field name="confirmPassword">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>
              Confirm Password{" "}
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </Label>
            <PasswordInput
              errors={field.state.meta.errors}
              checked={field.state.meta.isBlurred && Boolean(field.state.value)}
              checking={field.state.meta.isValidating}
              onClear={() => field.handleChange("")}
              id={field.name}
              name={field.name}
              autoComplete="new-password"
              placeholder="Enter your password again"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
          </div>
        )}
      </form.Field>
      {submitError && <p className="text-destructive text-sm">{submitError}</p>}
      <form.Subscribe
        selector={(state) =>
          [
            signUpSchema.safeParse(state.values).success && state.canSubmit,
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
