"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "@gorth/primitive/cores/tanstack/form"
import { Loader2, Send } from "@gorth/primitive/cores/lucide"

import { auth } from "@/lib/auth/client"
import { setPendingVerification } from "@/lib/auth/client/pending-verification"
import { forgotPasswordSchema } from "@/schemas/auth"
import { Button } from "@gorth/primitive/custom/button"
import { StatusInput as Input } from "@gorth/primitive/custom/input-status"
import { Label } from "@gorth/primitive/default/label"

export function ForgotPasswordForm() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const router = useRouter()
  const form = useForm({
    defaultValues: { email: "" },
    validators: { onChange: forgotPasswordSchema },
    onSubmit: async ({ value }) => {
      setSubmitError(null)
      try {
        const email = value.email.trim()
        const result = await auth.emailOtp.requestPasswordReset({
          email,
        })
        if (result.error) {
          setSubmitError(result.error.message ?? "Could not send reset code")
          return
        }

        setPendingVerification({
          email,
          type: "forget-password",
          source: "forgot-password",
          redirect: "/auth/reset-password",
          oauthQuery: "",
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
      {submitError && <p className="text-destructive text-sm">{submitError}</p>}
      <form.Subscribe
        selector={(state) =>
          [
            forgotPasswordSchema.safeParse(state.values).success,
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
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
            {isSubmitting ? "Sending..." : "Send verification code"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
