"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "@gorth/primitive/cores/tanstack/form"
import { ArrowRight, Loader2 } from "@gorth/primitive/cores/lucide"

import { AuthFieldError } from "@/components/auth/auth-field-error"
import { auth } from "@/lib/auth"
import { forgotPasswordSchema } from "@/schemas/auth"
import { Button } from "@gorth/primitive/custom/button"
import { Input } from "@gorth/primitive/default/input"
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
        const result = await auth.requestPasswordReset({
          email: value.email,
          redirectTo: `${window.location.origin}/auth/change-password`,
        })
        if (result.error) {
          setSubmitError(result.error.message ?? "Could not send reset email")
          return
        }
        router.push(`/auth/otp?email=${encodeURIComponent(value.email)}`)
      } catch (cause) {
        setSubmitError(
          cause instanceof Error ? cause.message : "An error occurred"
        )
      }
    },
  })

  return (
    <form
      className="grid gap-2"
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
            className="mt-2 w-full"
            type="submit"
            disabled={!isValid || isSubmitting}
          >
            Continue{" "}
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <ArrowRight />
            )}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
