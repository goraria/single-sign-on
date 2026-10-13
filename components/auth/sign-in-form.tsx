"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "@gorth/primitive/cores/tanstack/form"
import { Loader2, LogIn } from "@gorth/primitive/cores/lucide"

import { PasswordInput } from "@gorth/primitive/custom/input-password"
import { SocialForm } from "@/components/auth/social-form"
import { useAuth } from "@/hooks/use-auth"
import { signInWithIdentifier } from "@/lib/auth/client/username"
import { setPendingVerification } from "@/lib/auth/client/pending-verification"
import { signInSchema } from "@/schemas/auth"
import {
  buildLegacyDisabledPath,
  buildOAuthAuthorizePath,
  hasOAuthQuery,
  isExternalRedirect,
} from "@/utils/client/temp"
import { resolveInternalPath } from "@/utils/client/formatter"
import { Button } from "@gorth/primitive/custom/button"
import { Checkbox } from "@gorth/primitive/default/checkbox"
import { StatusInput as Input } from "@gorth/primitive/custom/input-status"
import { Label } from "@gorth/primitive/default/label"

export function LoginForm({ addAccount = false }: { addAccount?: boolean }) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") ?? "/"
  const oauthQueryString = searchParams.toString()
  const { account } = useAuth()
  const navigationStarted = useRef(false)

  const getAuthenticationDestination = useCallback(() => {
    const oauthQuery = new URLSearchParams(oauthQueryString)

    if (hasOAuthQuery(oauthQuery)) {
      if (addAccount) return `/auth/select-account?${oauthQueryString}`
      return buildOAuthAuthorizePath(oauthQuery)
    }

    if (isExternalRedirect(redirect)) {
      return buildLegacyDisabledPath()
    }

    return resolveInternalPath(redirect)
  }, [addAccount, oauthQueryString, redirect])

  const continueAfterAuthentication = useCallback(
    (replace: boolean) => {
      if (navigationStarted.current) return
      navigationStarted.current = true

      const destination = getAuthenticationDestination()
      if (replace) window.location.replace(destination)
      else window.location.assign(destination)
    },
    [getAuthenticationDestination]
  )

  useEffect(() => {
    if (!account || addAccount) return
    continueAfterAuthentication(true)
  }, [account, addAccount, continueAfterAuthentication])

  const form = useForm({
    defaultValues: { identifier: "", password: "", rememberMe: true },
    validators: { onChange: signInSchema },
    onSubmit: async ({ value }) => {
      setSubmitError(null)
      try {
        const result = await signInWithIdentifier(
          value,
          getAuthenticationDestination(),
          addAccount
        )
        if (result.error) {
          if (
            result.error.code === "EMAIL_NOT_VERIFIED" ||
            result.error.message === "Email not verified"
          ) {
            if (!value.identifier.includes("@")) {
              setSubmitError(
                "Email not verified. Sign in with your email address to continue verification."
              )
              return
            }
            setPendingVerification({
              email: value.identifier,
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
      <form.Field name="identifier">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>
              Email or username{" "}
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
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="name@example.com or username"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
          </div>
        )}
      </form.Field>
      <form.Field name="password">
        {(field) => (
          <div className="relative grid gap-2">
            <Label htmlFor={field.name}>
              Password{" "}
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </Label>
            <Link
              href="/auth/forgot-password"
              tabIndex={-1}
              className="absolute end-0 top-0.5 text-xs leading-none text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
            <PasswordInput
              errors={field.state.meta.errors}
              checked={field.state.meta.isBlurred && Boolean(field.state.value)}
              checking={field.state.meta.isValidating}
              onClear={() => field.handleChange("")}
              id={field.name}
              name={field.name}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
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
      {submitError && <p className="text-sm text-destructive">{submitError}</p>}
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
      <SocialForm addAccount={addAccount} />
    </form>
  )
}
