"use client"

import { useState, type ComponentPropsWithoutRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "@gorth/primitive/cores/tanstack/form"
import { KeyRound, Loader2 } from "@gorth/primitive/cores/lucide"
import { Button } from "@gorth/primitive/custom/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gorth/primitive/default/card"
import { Label } from "@gorth/primitive/default/label"
import { cn } from "@gorth/primitive/lib/utils"

import { AuthFieldError } from "@/components/auth/auth-field-error"
import { PasswordInput } from "@/components/auth/password-input"
import { auth } from "@/lib/auth"
import { changePasswordSchema } from "@/schemas/auth"

export function UpdatePasswordForm({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect")
  const token = searchParams.get("token")
  const form = useForm({
    defaultValues: { password: "" },
    validators: { onChange: changePasswordSchema },
    onSubmit: async ({ value }) => {
      setSubmitError(null)

      if (!token) {
        setSubmitError("Missing password reset token")
        return
      }

      try {
        const result = await auth.resetPassword({
          newPassword: value.password,
          token,
        })

        if (result.error) {
          setSubmitError(result.error.message ?? "Could not reset password")
          return
        }

        router.push(redirect ?? "/auth/sign-in")
      } catch (cause) {
        setSubmitError(
          cause instanceof Error ? cause.message : "An error occurred",
        )
      }
    },
  })

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>Please enter your new password below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-6"
            onSubmit={(event) => {
              event.preventDefault()
              event.stopPropagation()
              void form.handleSubmit()
            }}
          >
            <form.Field name="password">
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>New password</Label>
                  <PasswordInput
                    id={field.name}
                    name={field.name}
                    autoComplete="new-password"
                    placeholder="New password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  <AuthFieldError errors={field.state.meta.errors} />
                </div>
              )}
            </form.Field>
            {submitError ? (
              <p className="text-destructive text-sm">{submitError}</p>
            ) : null}
            <form.Subscribe
              selector={(state) =>
                [
                  changePasswordSchema.safeParse(state.values).success,
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
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <KeyRound className="size-4" />
                  )}
                  Save new password
                </Button>
              )}
            </form.Subscribe>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
