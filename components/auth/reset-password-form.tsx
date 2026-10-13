"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "@gorth/primitive/cores/tanstack/form"
import { KeyRound, Loader2 } from "@gorth/primitive/cores/lucide"

import { PasswordInput } from "@gorth/primitive/custom/input-password"
import { auth } from "@/lib/auth/client"
import {
  clearPendingVerification,
  getPendingVerification,
} from "@/lib/auth/client/pending-verification"
import { getFormErrorMessage } from "@/utils/client/formatter"
import { resetPasswordSchema } from "@/schemas/auth"
import { Button } from "@gorth/primitive/custom/button"
import { Label } from "@gorth/primitive/default/label"

export function ResetPasswordForm() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const router = useRouter()
  const pending = useMemo(() => getPendingVerification(), [])

  const canReset = Boolean(
    pending?.type === "forget-password" && pending.verifiedOtp
  )

  useEffect(() => {
    if (!canReset) router.replace("/auth/sign-in")
  }, [canReset, router])

  const form = useForm({
    defaultValues: { password: "", confirmPassword: "" },
    validators: { onChange: resetPasswordSchema },
    onSubmit: async ({ value }) => {
      if (!pending?.verifiedOtp || pending.type !== "forget-password") return

      setSubmitError(null)

      try {
        const result = await auth.emailOtp.resetPassword({
          email: pending.email,
          otp: pending.verifiedOtp,
          password: value.password,
        })

        if (result.error) {
          setSubmitError(
            getFormErrorMessage(result.error) ?? "Could not reset password"
          )
          return
        }

        clearPendingVerification()
        router.replace("/auth/sign-in")
      } catch (cause) {
        setSubmitError(getFormErrorMessage(cause) ?? "An error occurred")
      }
    },
  })

  if (!canReset) return null

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <form.Field name="password">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>
              New password{" "}
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
              Confirm new password{" "}
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

      {submitError ? (
        <p className="text-destructive text-sm">{submitError}</p>
      ) : null}

      <form.Subscribe
        selector={(state) =>
          [
            resetPasswordSchema.safeParse(state.values).success,
            state.isSubmitting,
          ] as const
        }
      >
        {([isValid, isSubmitting]) => (
          <Button
            type="submit"
            className="w-full"
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <KeyRound />}
            {isSubmitting ? "Saving..." : "Reset password"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
