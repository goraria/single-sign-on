"use client"

import { useForm } from "@gorth/primitive/cores/tanstack/form"
import { KeyRound } from "@gorth/primitive/cores/lucide"
import { Button } from "@gorth/primitive/custom/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gorth/primitive/default/card"
import { Label } from "@gorth/primitive/default/label"
import { toast } from "@gorth/primitive/default/toast"
import { Spinner } from "@gorth/primitive/pattern/spinner"

import { PasswordInput } from "@/components/auth/password-input"
import { auth } from "@/lib/auth"
import { accountPasswordSchema } from "@/schemas/auth"

export function ChangePasswordForm() {
  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validators: { onChange: accountPasswordSchema },
    onSubmit: async ({ value }) => {
      try {
        const result = await auth.changePassword({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
          revokeOtherSessions: true,
        })

        if (result.error) {
          toast.add({
            type: "error",
            description: result.error.message ?? "Unable to change password.",
            priority: "high",
          })
          return
        }

        form.reset()
        toast.add({
          type: "success",
          description: "Your password has been changed.",
        })
      } catch (cause) {
        toast.add({
          type: "error",
          description:
            cause instanceof Error
              ? cause.message
              : "Unable to change password.",
          priority: "high",
        })
      }
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>
          Use a strong password that you do not reuse elsewhere.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <form.Field name="currentPassword">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label htmlFor={field.name}>Current password</Label>
                <PasswordInput
                  autoComplete="current-password"
                  id={field.name}
                  name={field.name}
                  placeholder="Enter your current password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="newPassword">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label htmlFor={field.name}>New password</Label>
                <PasswordInput
                  autoComplete="new-password"
                  id={field.name}
                  name={field.name}
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
              <div className="flex flex-col gap-2">
                <Label htmlFor={field.name}>Confirm new password</Label>
                <PasswordInput
                  autoComplete="new-password"
                  id={field.name}
                  name={field.name}
                  placeholder="Enter your new password again"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </div>
            )}
          </form.Field>

          <div className="flex flex-wrap gap-2">
            <form.Subscribe
              selector={(state) =>
                [
                  state.isDirty,
                  state.isSubmitting,
                  accountPasswordSchema.safeParse(state.values).success,
                ] as const
              }
            >
              {([isDirty, isSubmitting, isValid]) => (
                <Button
                  disabled={!isDirty || isSubmitting || !isValid}
                  type="submit"
                >
                  {isSubmitting ? (
                    <Spinner variant="infinite" size={16} />
                  ) : (
                    <KeyRound className="size-4" />
                  )}
                  {isSubmitting ? "Saving..." : "Save changes"}
                </Button>
              )}
            </form.Subscribe>
            <Button
              onClick={() => form.reset()}
              type="button"
              variant="secondary"
            >
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
