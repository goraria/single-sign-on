"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "@gorth/primitive/cores/tanstack/form"
import { Loader2, RotateCcw, ShieldCheck } from "@gorth/primitive/cores/lucide"

import { FieldError } from "@/components/auth/field-error"
import { auth } from "@/lib/auth"
import { continueOAuthRegistration } from "@/lib/auth/oauth-registration"
import {
  clearPendingVerification,
  getPendingVerification,
  setPendingVerificationOtp,
} from "@/lib/auth/pending-verification"
import {
  formatCountdown,
  getErrorCode,
  getFormErrorMessage,
} from "@/lib/utils/formatter"
import {
  buildLegacyDisabledPath,
  buildOAuthAuthorizePath,
  hasOAuthQuery,
  isExternalRedirect,
} from "@/lib/utils/temp"
import { oneTimePasswordSchema } from "@/schemas/auth"
import { Button } from "@gorth/primitive/custom/button"
import { Label } from "@gorth/primitive/default/label"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@gorth/primitive/default/input-otp"

const resendDelay = 120
const maximumAttempts = 3

export function OtpForm() {
  const router = useRouter()
  const pending = useMemo(() => getPendingVerification(), [])
  const [secondsRemaining, setSecondsRemaining] = useState(resendDelay)
  const [attempts, setAttempts] = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)

  const isLocked = attempts >= maximumAttempts
  const isExpired = secondsRemaining === 0

  useEffect(() => {
    if (!pending) {
      router.replace("/auth/sign-in")
      return
    }

    const timer = window.setInterval(() => {
      setSecondsRemaining((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [pending, router])

  const completeEmailVerification = async (otp: string) => {
    if (!pending) return

    const result = await auth.emailOtp.verifyEmail({
      email: pending.email,
      otp,
    })

    if (result.error) throw result.error

    const oauthQuery = new URLSearchParams(pending.oauthQuery)
    const { redirect } = pending

    clearPendingVerification()

    if (hasOAuthQuery(oauthQuery)) {
      if (pending.source === "sign-up") {
        try {
          await continueOAuthRegistration(pending.oauthQuery)
        } catch {
          router.replace(
            "/auth/error?error=oauth_registration_continuation_failed"
          )
        }
      } else {
        window.location.assign(buildOAuthAuthorizePath(oauthQuery))
      }
      return
    }

    if (isExternalRedirect(redirect)) {
      window.location.assign(buildLegacyDisabledPath())
      return
    }

    router.replace(redirect || "/")
    router.refresh()
  }

  const completePasswordResetVerification = async (otp: string) => {
    if (!pending) return

    const result = await auth.emailOtp.checkVerificationOtp({
      email: pending.email,
      type: "forget-password",
      otp,
    })

    if (result.error) throw result.error

    setPendingVerificationOtp(otp)
    router.replace("/auth/reset-password")
  }

  const form = useForm({
    defaultValues: { otp: "" },
    validators: { onChange: oneTimePasswordSchema },
    onSubmit: async ({ value }) => {
      if (!pending || isLocked) return

      setSubmitError(null)

      try {
        if (pending.type === "email-verification") {
          await completeEmailVerification(value.otp)
        } else {
          await completePasswordResetVerification(value.otp)
        }
      } catch (cause) {
        const errorCode = getErrorCode(cause)

        if (errorCode === "OTP_EXPIRED") {
          setSecondsRemaining(0)
          setSubmitError(
            "This verification code has expired. Request a new code to continue."
          )
          return
        }

        if (errorCode === "TOO_MANY_ATTEMPTS") {
          setAttempts(maximumAttempts)
          setSubmitError(
            "Too many incorrect attempts. Request a new code to continue."
          )
          return
        }

        if (errorCode !== "INVALID_OTP") {
          setSubmitError(
            getFormErrorMessage(cause) ?? "Could not verify the code."
          )
          return
        }

        const nextAttempts = attempts + 1
        setAttempts(nextAttempts)
        form.setFieldValue("otp", "")
        setSubmitError(
          nextAttempts >= maximumAttempts
            ? "Too many incorrect attempts. Request a new code to continue."
            : (getFormErrorMessage(cause) ??
                `Invalid code. ${maximumAttempts - nextAttempts} attempts remaining.`)
        )
      }
    },
  })

  const resend = async () => {
    if (!pending || secondsRemaining > 0 || isResending) return

    setIsResending(true)
    setSubmitError(null)

    try {
      const result =
        pending.type === "email-verification"
          ? await auth.emailOtp.sendVerificationOtp({
              email: pending.email,
              type: "email-verification",
            })
          : await auth.emailOtp.requestPasswordReset({
              email: pending.email,
            })

      if (result.error) throw result.error

      setAttempts(0)
      setSecondsRemaining(resendDelay)
      form.reset()
    } catch (cause) {
      setSubmitError(getFormErrorMessage(cause) ?? "Could not resend the code.")
    } finally {
      setIsResending(false)
    }
  }

  if (!pending) return null

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <form.Field name="otp">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Verification code</Label>
            <InputOTP
              id={field.name}
              maxLength={6}
              inputMode="numeric"
              pattern="[0-9]*"
              name={field.name}
              autoComplete="one-time-code"
              disabled={isLocked || isExpired}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(value) =>
                field.handleChange(value.replace(/\D/g, "").slice(0, 6))
              }
              containerClassName="justify-center"
            >
              <InputOTPGroup className="gap-4">
                {Array.from({ length: 6 }, (_, index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="size-9 rounded-md border"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

      <p className="text-muted-foreground text-center text-sm">
        We sent a six-digit code to {pending.email}.
      </p>

      {submitError ? (
        <p className="text-destructive text-center text-sm">{submitError}</p>
      ) : null}

      <form.Subscribe
        selector={(state) =>
          [
            oneTimePasswordSchema.safeParse(state.values).success,
            state.isSubmitting,
          ] as const
        }
      >
        {([isValid, isSubmitting]) => (
          <Button
            className="w-full"
            type="submit"
            disabled={!isValid || isSubmitting || isLocked || isExpired}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <ShieldCheck />
            )}
            {isSubmitting ? "Verifying..." : "Verify code"}
          </Button>
        )}
      </form.Subscribe>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={secondsRemaining > 0 || isResending}
        onClick={() => void resend()}
      >
        {isResending ? <Loader2 className="animate-spin" /> : <RotateCcw />}
        {isResending
          ? "Sending..."
          : secondsRemaining > 0
            ? `Resend in ${formatCountdown(secondsRemaining)}`
            : "Resend code"}
      </Button>

      <p className="text-muted-foreground text-center text-xs">
        {Math.max(0, maximumAttempts - attempts)} attempts remaining
      </p>
    </form>
  )
}
