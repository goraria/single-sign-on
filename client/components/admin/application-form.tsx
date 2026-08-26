"use client"

import { type FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@gorth/primitive/custom/button"
import { Checkbox } from "@gorth/primitive/default/checkbox"
import { Input } from "@gorth/primitive/default/input"
import { Label } from "@gorth/primitive/default/label"
import { Textarea } from "@gorth/primitive/default/textarea"
import {
  createSsoApplication,
  deleteSsoApplication,
  listSsoApplications,
  updateSsoApplication,
  type SsoApplication,
} from "@/services/administrator"
import {
  toSsoApplicationFormState,
  toSsoApplicationPayload,
  type SsoApplicationFormState,
} from "@/lib/utils/temp"

const emptyApplication: SsoApplicationFormState = {
  id: "",
  clientId: "",
  name: "",
  description: "",
  homepageUrl: "",
  icon: "",
  redirectUris: "",
  postLogoutRedirectUris: "",
  scopes: "openid\nprofile\nemail\noffline_access",
  grantTypes: "authorization_code\nrefresh_token",
  responseTypes: "code",
  public: true,
  requirePKCE: true,
  tokenEndpointAuthMethod: "none",
  skipConsent: true,
  disabled: false,
}

export function ApplicationEditor({ id }: { id: string }) {
  const [application, setApplication] = useState<SsoApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    listSsoApplications()
      .then((items) => {
        if (!active) return
        const selected = items.find((item) => item.id === id)
        if (selected) setApplication(selected)
        else setError("Application not found")
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load application"
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  if (loading)
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
        Loading application...
      </div>
    )
  if (error || !application)
    return (
      <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
        {error ?? "Application not found"}
      </div>
    )

  return <ApplicationForm application={application} />
}

export function ApplicationForm({
  application,
}: {
  application?: SsoApplication
}) {
  const router = useRouter()
  const [form, setForm] = useState(() =>
    application ? toSsoApplicationFormState(application) : emptyApplication
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = toSsoApplicationPayload(form)
      const saved = application
        ? await updateSsoApplication(application.id, payload)
        : await createSsoApplication(payload)
      router.replace(`/admin/apps/edit/${saved.id}`)
      router.refresh()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save application"
      )
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (
      !application ||
      !window.confirm(
        `Delete ${application.name}? Existing grants will be revoked.`
      )
    )
      return
    setSaving(true)
    setError(null)
    try {
      await deleteSsoApplication(application.id)
      router.replace("/admin/apps")
      router.refresh()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to delete application"
      )
      setSaving(false)
    }
  }

  function update<Key extends keyof SsoApplicationFormState>(
    key: Key,
    value: SsoApplicationFormState[Key]
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {application ? "Edit application" : "Create application"}
        </h1>
        <p className="text-muted-foreground">
          Configure the OAuth client and its allowed redirect destinations.
        </p>
      </div>
      {error ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {error}
        </div>
      ) : null}
      <form
        onSubmit={submit}
        className="space-y-6 rounded-lg border p-4 md:p-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Client ID">
            <Input
              value={form.clientId}
              onChange={(event) => update("clientId", event.target.value)}
              disabled={Boolean(application)}
              required
            />
          </TextField>
          <TextField label="Name">
            <Input
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              required
            />
          </TextField>
          <TextField label="Homepage URL">
            <Input
              value={form.homepageUrl}
              onChange={(event) => update("homepageUrl", event.target.value)}
            />
          </TextField>
          <TextField label="Icon URL">
            <Input
              value={form.icon}
              onChange={(event) => update("icon", event.target.value)}
            />
          </TextField>
        </div>
        <TextAreaField
          label="Description"
          value={form.description}
          onChange={(value) => update("description", value)}
        />
        <TextAreaField
          label="Redirect URIs"
          value={form.redirectUris}
          onChange={(value) => update("redirectUris", value)}
        />
        <TextAreaField
          label="Post logout redirect URIs"
          value={form.postLogoutRedirectUris}
          onChange={(value) => update("postLogoutRedirectUris", value)}
        />
        <div className="grid gap-4 md:grid-cols-3">
          <TextAreaField
            label="Scopes"
            value={form.scopes}
            onChange={(value) => update("scopes", value)}
          />
          <TextAreaField
            label="Grant types"
            value={form.grantTypes}
            onChange={(value) => update("grantTypes", value)}
          />
          <TextAreaField
            label="Response types"
            value={form.responseTypes}
            onChange={(value) => update("responseTypes", value)}
          />
        </div>
        <TextField label="Token endpoint auth method">
          <Input
            value={form.tokenEndpointAuthMethod}
            onChange={(event) =>
              update("tokenEndpointAuthMethod", event.target.value)
            }
          />
        </TextField>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["public", "Public client"],
              ["requirePKCE", "Require PKCE"],
              ["skipConsent", "Skip consent"],
              ["disabled", "Disabled"],
            ] as const
          ).map(([key, label]) => (
            <Label key={key} className="flex items-center gap-2 font-normal">
              <Checkbox
                checked={form[key]}
                onCheckedChange={(checked) => update(key, Boolean(checked))}
              />
              {label}
            </Label>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>
            {saving
              ? "Saving..."
              : application
                ? "Save changes"
                : "Create application"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/apps")}
          >
            Cancel
          </Button>
          {application ? (
            <Button
              type="button"
              variant="destructive"
              disabled={saving}
              onClick={() => void remove()}
            >
              Delete
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  )
}

function TextField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-24"
      />
    </div>
  )
}
