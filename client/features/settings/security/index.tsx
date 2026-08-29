"use client"

import { useLayoutEffect, useRef } from "react"
import { useForm } from "@gorth/primitive/cores/tanstack/form"
import {
  Camera,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
} from "@gorth/primitive/cores/lucide"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@gorth/primitive/custom/avatar"
import { Button } from "@gorth/primitive/custom/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@gorth/primitive/default/accordion"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gorth/primitive/default/card"
import { Checkbox } from "@gorth/primitive/default/checkbox"
import { Input } from "@gorth/primitive/default/input"
import { Label } from "@gorth/primitive/default/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gorth/primitive/default/select"
import { Toaster, toast } from "@gorth/primitive/default/toast"
import { Spinner } from "@gorth/primitive/pattern/spinner"

import { ChangePasswordForm } from "@/components/auth/change-password-form"
import { LoadingScreen } from "@/features/shared/loading"
import { useAuth, type AuthUser } from "@/hooks/use-auth"
import { useUser } from "@/hooks/use-user"
import { auth } from "@/lib/auth"
import { useUploadProfileImageMutation } from "@/lib/supabase/storage"
import {
  formatDisplayName,
  formatDate,
  formatUsernameLabel,
  getAccountProfileDefaults,
  getInitials,
  sanitizeUsernameInput,
  type DisplayNameFormat,
} from "@/lib/utils/formatter"
import { accountProfileSchema } from "@/schemas/auth"

function AccountDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-sm font-medium break-words">{value || "Unknown"}</dd>
    </div>
  )
}

function AccountDetailsCard({ account }: { account: AuthUser }) {
  const user = useUser()
  const details = [
    ["Account ID", account.id],
    ["Username", account.username ?? "Unknown"],
    ["First name", account.firstName ?? "Unknown"],
    ["Last name", account.lastName ?? "Unknown"],
    ["Avatar URL", account.image ?? "Unknown"],
    ["Email status", account.emailVerified ? "Verified" : "Unverified"],
    [
      "Created at",
      account.createdAt ? formatDate(account.createdAt) : "Unknown",
    ],
    [
      "Updated at",
      account.updatedAt ? formatDate(account.updatedAt) : "Unknown",
    ],
  ] as const

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account details</CardTitle>
        <CardDescription>
          Review the identity and account data associated with this session.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid gap-4 sm:grid-cols-3">
          <AccountDetail label="Display name" value={user.name} />
          <AccountDetail label="Email" value={user.email} />
          <AccountDetail label="Role" value={formatUsernameLabel(user.role)} />
        </dl>

        <Accordion className="border-t">
          <AccordionItem value="account-information">
            <AccordionTrigger>All account information</AccordionTrigger>
            <AccordionContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                {details.map(([label, value]) => (
                  <AccountDetail key={label} label={label} value={value} />
                ))}
              </dl>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}

function ProfileCard() {
  const authState = useAuth()
  const account = authState.account
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadProfileImage, uploadProfileImageState] =
    useUploadProfileImageMutation()
  const uploading = uploadProfileImageState.isLoading
  const form = useForm({
    defaultValues: getAccountProfileDefaults(account),
    validators: { onChange: accountProfileSchema },
    onSubmit: async ({ value }) => {
      try {
        const result = await auth.updateUser({
          name: formatDisplayName(value.nameFormat, value),
          username: value.username.trim(),
          firstName: value.firstName.trim(),
          lastName: value.lastName.trim(),
          image: value.image.trim() || null,
        } as Parameters<typeof auth.updateUser>[0] & {
          username: string
          firstName: string
          lastName: string
        })

        if (result.error) {
          const message = result.error.message ?? "Unable to update account."
          toast.add({ type: "error", description: message, priority: "high" })
          return
        }

        const updated = await authState.refresh()
        form.reset(getAccountProfileDefaults(updated))
        toast.add({
          type: "success",
          description: "Account information has been updated.",
        })
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : "Unable to update account."
        toast.add({ type: "error", description: message, priority: "high" })
      }
    },
  })

  useLayoutEffect(() => {
    form.reset(getAccountProfileDefaults(account))
  }, [account, form])

  async function uploadImage(file: File, onChange: (value: string) => void) {
    if (!account) return

    try {
      const uploaded = await uploadProfileImage(file).unwrap()
      onChange(uploaded.url)
      toast.add({
        type: "success",
        description:
          "Image uploaded. Save your changes to apply it to your account.",
      })
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Unable to upload image."
      toast.add({ type: "error", description: message, priority: "high" })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  if (authState.loading || !account) {
    return <LoadingScreen />
  }

  return (
    <div className="flex flex-col gap-6 lg:col-span-2">
      <Card>
        <CardHeader>
          <CardTitle>Account information</CardTitle>
          <CardDescription>
            Update your profile image and personal information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-6"
            onSubmit={(event) => {
              event.preventDefault()
              event.stopPropagation()
              void form.handleSubmit()
            }}
          >
            <form.Field name="image">
              {(field) => (
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  <Avatar className="size-24 rounded-3xl">
                    <AvatarImage
                      alt={account?.name ?? "Account avatar"}
                      className="rounded-3xl object-cover"
                      src={field.state.value || undefined}
                    />
                    <AvatarFallback className="rounded-3xl text-xl">
                      {getInitials(account?.name ?? account?.email ?? "User")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Input
                      readOnly
                      type="hidden"
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                    />
                    <input
                      ref={fileInputRef}
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      type="file"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) void uploadImage(file, field.handleChange)
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                        type="button"
                      >
                        {uploading ? (
                          <Spinner variant="infinite" size={16} />
                        ) : (
                          <Camera className="size-4" />
                        )}
                        {uploading ? "Uploading..." : "Upload new image"}
                      </Button>
                      <Button
                        disabled={
                          uploading ||
                          field.state.value === (account.image ?? "")
                        }
                        onClick={() => {
                          field.handleChange(account.image ?? "")
                        }}
                        type="button"
                        variant="secondary"
                      >
                        <RotateCcw className="size-4" />
                        Reset
                      </Button>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      JPG, JPEG, PNG, GIF, or WebP. Maximum size 2048 KB.
                    </p>
                  </div>
                </div>
              )}
            </form.Field>

            <div className="border-t" />

            <div className="grid gap-4 md:grid-cols-6">
              <form.Field name="firstName">
                {(field) => (
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label htmlFor={field.name}>First name</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      placeholder="Enter your first name"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="lastName">
                {(field) => (
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label htmlFor={field.name}>Last name</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      placeholder="Enter your last name"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="username">
                {(field) => (
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label htmlFor={field.name}>Username</Label>
                    <Input
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="username"
                      id={field.name}
                      inputMode="text"
                      maxLength={32}
                      minLength={5}
                      name={field.name}
                      pattern="[a-z0-9._]+"
                      placeholder="Enter your username"
                      spellCheck={false}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(
                          sanitizeUsernameInput(event.target.value)
                        )
                      }
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="nameFormat">
                {(field) => (
                  <div className="grid grid-rows-[1.25rem_2.25rem] content-start gap-2 md:col-span-3">
                    <div className="flex h-5 items-center">
                      <Label htmlFor={field.name}>Display name</Label>
                    </div>
                    <form.Subscribe
                      selector={(state) =>
                        [
                          state.values.firstName,
                          state.values.lastName,
                          state.values.username,
                        ] as const
                      }
                    >
                      {([firstName, lastName, username]) => {
                        const values = { firstName, lastName, username }
                        const hasFullName = Boolean(
                          firstName.trim() && lastName.trim()
                        )
                        const usernameLabel = formatUsernameLabel(
                          username,
                          "Unknown"
                        )
                        const lockedDisplayName = username.trim()
                          ? usernameLabel
                          : account.name?.trim() || "Unknown"

                        return (
                          <Select
                            disabled={!hasFullName}
                            value={field.state.value}
                            onValueChange={(value) =>
                              field.handleChange(value as DisplayNameFormat)
                            }
                          >
                            <SelectTrigger id={field.name} className="w-full">
                              <SelectValue>
                                {hasFullName
                                  ? formatDisplayName(
                                      field.state.value,
                                      values
                                    ) || usernameLabel
                                  : lockedDisplayName}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="first-last">
                                {formatDisplayName("first-last", values)}
                              </SelectItem>
                              <SelectItem value="last-first">
                                {formatDisplayName("last-first", values)}
                              </SelectItem>
                              <SelectItem value="first">
                                {formatDisplayName("first", values)}
                              </SelectItem>
                              <SelectItem value="last">
                                {formatDisplayName("last", values)}
                              </SelectItem>
                              <SelectItem
                                disabled={!username.trim()}
                                value="username"
                              >
                                {usernameLabel}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )
                      }}
                    </form.Subscribe>
                  </div>
                )}
              </form.Field>

              <form.Field name="email">
                {(field) => (
                  <div className="grid grid-rows-[1.25rem_2.25rem] content-start gap-2 md:col-span-3">
                    <div className="flex h-5 items-center justify-between gap-2">
                      <Label className="h-5" htmlFor={field.name}>
                        Email
                        <span className="text-muted-foreground leading-none font-normal">
                          (verified)
                        </span>
                      </Label>
                      <span className="text-muted-foreground shrink-0 text-xs leading-none">
                        Cannot be changed
                      </span>
                    </div>
                    <Input
                      disabled
                      id={field.name}
                      name={field.name}
                      placeholder="name@example.com"
                      type="email"
                      value={field.state.value}
                    />
                  </div>
                )}
              </form.Field>
            </div>

            <div className="flex flex-wrap gap-2">
              <form.Subscribe
                selector={(state) =>
                  [
                    state.isDirty,
                    state.isSubmitting,
                    accountProfileSchema.safeParse(state.values).success,
                  ] as const
                }
              >
                {([isDirty, isSubmitting, isValid]) => (
                  <Button
                    disabled={!isDirty || isSubmitting || uploading || !isValid}
                    type="submit"
                  >
                    {isSubmitting ? (
                      <Spinner variant="infinite" size={16} />
                    ) : (
                      <Save className="size-4" />
                    )}
                    {isSubmitting ? "Saving..." : "Save changes"}
                  </Button>
                )}
              </form.Subscribe>
              <form.Subscribe selector={(state) => state.isDirty}>
                {(isDirty) => (
                  <Button
                    disabled={!isDirty}
                    onClick={() => {
                      form.reset(getAccountProfileDefaults(account))
                    }}
                    type="button"
                    variant="secondary"
                  >
                    Cancel changes
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </form>
        </CardContent>
      </Card>
      <AccountDetailsCard account={account} />
    </div>
  )
}

function TwoFactorCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-factor authentication</CardTitle>
        <CardDescription>
          Add another layer of protection when signing in.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="text-primary size-5 shrink-0" />
          <p className="text-muted-foreground text-sm">
            Two-factor authentication is not enabled for this account.
          </p>
        </div>
        <Button className="w-fit" disabled variant="outline">
          Enable two-factor authentication
        </Button>
      </CardContent>
    </Card>
  )
}

function DeleteAccountCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Delete account</CardTitle>
        <CardDescription>This action cannot be undone.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox />I confirm that I want to deactivate my account
        </label>
        <Button className="w-fit" disabled variant="destructive">
          <Trash2 className="size-4" />
          Deactivate account
        </Button>
      </CardContent>
    </Card>
  )
}

export function SecuritySettingsPage() {
  return (
    <Toaster>
      <div className="grid gap-6 lg:grid-cols-3">
        <ProfileCard />
        <div className="flex flex-col gap-6 lg:col-span-1">
          <ChangePasswordForm />
          <TwoFactorCard />
          <DeleteAccountCard />
        </div>
      </div>
    </Toaster>
  )
}
