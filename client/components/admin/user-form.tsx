"use client"

import { type FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@gorth/primitive/custom/button"
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
import { PasswordInput } from "@/components/auth/password-input"
import { LoadingScreen } from "@/features/shared/loading"
import { userRoles } from "@/lib/utils/renderer"
import {
  type AdminUser,
  type AdminUserPayload,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUserQuery,
} from "@/services/admin"

interface UserFormState {
  firstName: string
  lastName: string
  username: string
  name: string
  email: string
  image: string
  role: AdminUser["role"]
  emailVerified: boolean
  bannedUntil: string
  password: string
}

const emptyUser: UserFormState = {
  firstName: "",
  lastName: "",
  username: "",
  name: "",
  email: "",
  image: "",
  role: "user",
  emailVerified: false,
  bannedUntil: "",
  password: "",
}

function toDateTimeLocal(value: string | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function toUserFormState(user: AdminUser): UserFormState {
  return {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    username: user.username ?? "",
    name: user.name,
    email: user.email,
    image: user.image ?? "",
    role: user.role,
    emailVerified: user.emailVerified,
    bannedUntil: toDateTimeLocal(user.bannedUntil),
    password: "",
  }
}

export function UserEditor({ id }: { id: string }) {
  const userQuery = useUserQuery(id)
  const user = userQuery.data

  if (userQuery.isLoading) return <LoadingScreen />
  if (userQuery.error || !user) {
    return (
      <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
        {userQuery.error?.message ?? "User not found"}
      </div>
    )
  }

  return <UserForm user={user} />
}

export function UserForm({ user }: { user?: AdminUser }) {
  const router = useRouter()
  const [form, setForm] = useState(() =>
    user ? toUserFormState(user) : emptyUser
  )
  const [createUser, createResult] = useCreateUserMutation()
  const [updateUser, updateResult] = useUpdateUserMutation()
  const saving = createResult.isLoading || updateResult.isLoading
  const error = createResult.error ?? updateResult.error

  function update<Key extends keyof UserFormState>(
    key: Key,
    value: UserFormState[Key]
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const payload: AdminUserPayload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      username: form.username.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      image: form.image.trim() || null,
      role: form.role,
      emailVerified: form.emailVerified,
      bannedUntil: form.bannedUntil
        ? new Date(form.bannedUntil).toISOString()
        : null,
      password: form.password,
    }

    try {
      const saved = user
        ? await updateUser({
            id: user.id,
            payload: {
              ...payload,
              password: payload.password || undefined,
            },
          }).unwrap()
        : await createUser(payload).unwrap()

      router.replace(`/admin/users/edit/${saved.id}`)
      router.refresh()
    } catch {
      // Caller exposes the normalized error through the mutation result.
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {user ? "Edit user" : "Create user"}
        </h1>
        <p className="text-muted-foreground">
          Manage the account profile, access role, verification, and password.
        </p>
      </div>
      {error ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {error.message}
        </div>
      ) : null}
      <form
        onSubmit={submit}
        className="flex flex-col gap-6 rounded-lg border p-4 md:p-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="First name" htmlFor="firstName">
            <Input
              id="firstName"
              placeholder="First name"
              value={form.firstName}
              onChange={(event) => update("firstName", event.target.value)}
              required
            />
          </TextField>
          <TextField label="Last name" htmlFor="lastName">
            <Input
              id="lastName"
              placeholder="Last name"
              value={form.lastName}
              onChange={(event) => update("lastName", event.target.value)}
              required
            />
          </TextField>
          <TextField label="Username" htmlFor="username">
            <Input
              id="username"
              placeholder="username"
              value={form.username}
              onChange={(event) =>
                update("username", event.target.value.toLowerCase())
              }
              minLength={5}
              maxLength={32}
              pattern="[a-z0-9._]+"
              required
            />
          </TextField>
          <TextField label="Display name" htmlFor="name">
            <Input
              id="name"
              placeholder="Display name"
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              required
            />
          </TextField>
          <TextField label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              required
            />
          </TextField>
          <TextField label="Role" htmlFor="role">
            <Select
              value={form.role}
              onValueChange={(value) =>
                update("role", value as AdminUser["role"])
              }
            >
              <SelectTrigger id="role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {userRoles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TextField>
          <TextField label="Avatar URL" htmlFor="image">
            <Input
              id="image"
              type="url"
              placeholder="https://example.com/avatar.png"
              value={form.image}
              onChange={(event) => update("image", event.target.value)}
            />
          </TextField>
          <TextField label="Banned until" htmlFor="bannedUntil">
            <Input
              id="bannedUntil"
              type="datetime-local"
              value={form.bannedUntil}
              onChange={(event) => update("bannedUntil", event.target.value)}
            />
          </TextField>
        </div>
        <TextField
          label={user ? "New password" : "Password"}
          htmlFor="password"
        >
          <PasswordInput
            id="password"
            placeholder={
              user ? "Leave blank to keep current password" : "Password"
            }
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
            minLength={8}
            required={!user}
          />
        </TextField>
        <Label className="flex items-center gap-2 font-normal">
          <Checkbox
            checked={form.emailVerified}
            onCheckedChange={(checked) =>
              update("emailVerified", Boolean(checked))
            }
          />
          Email verified
        </Label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : user ? "Save changes" : "Create user"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/users")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

function TextField({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}
