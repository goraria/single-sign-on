"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { useForm } from "@gorth/primitive/cores/tanstack/form"

import { AuthFieldError } from "@/components/auth/auth-field-error"
import { oneTimePasswordSchema } from "@/schemas/auth"
import { Button } from "@gorth/primitive/custom/button"
import { Label } from "@gorth/primitive/default/label"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@gorth/primitive/default/input-otp"

export function OtpForm() {
  const [message, setMessage] = useState<string | null>(null)
  const email = useSearchParams().get("email")
  const form = useForm({
    defaultValues: { otp: "" },
    validators: { onChange: oneTimePasswordSchema },
    onSubmit: () => {
      setMessage(
        "Open the password-reset link sent to your email to continue securely."
      )
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
      <form.Field name="otp">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name} className="sr-only">
              One-Time Password
            </Label>
            <InputOTP
              id={field.name}
              maxLength={6}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              containerClassName="justify-between sm:[&>[data-slot=input-otp-group]>div]:w-12"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <AuthFieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>
      {email && (
        <p className="text-muted-foreground text-center text-sm">
          Reset instructions were sent to {email}.
        </p>
      )}
      {message && (
        <p className="text-muted-foreground text-center text-sm">{message}</p>
      )}
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
            className="mt-2 w-full"
            type="submit"
            disabled={!isValid || isSubmitting}
          >
            Verify
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
