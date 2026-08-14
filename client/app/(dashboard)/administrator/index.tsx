"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { Button } from "@gorth/primitive/default/button"
import { Input } from "@gorth/primitive/default/input"
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

const defaultFormState: SsoApplicationFormState = {
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

interface CheckboxFieldProps {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}

function CheckboxField({ checked, label, onChange }: CheckboxFieldProps) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  )
}

interface TextareaFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
}

function TextareaField({
  label,
  value,
  onChange,
  rows = 4,
}: TextareaFieldProps) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="bg-background focus-visible:ring-ring min-h-24 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
      />
    </label>
  )
}

export function AdministratorApplications() {
  const [applications, setApplications] = useState<SsoApplication[]>([])
  const [form, setForm] = useState<SsoApplicationFormState>(defaultFormState)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selectedApplication = useMemo(
    () => applications.find((application) => application.id === form.id),
    [applications, form.id]
  )

  async function refresh() {
    setLoading(true)
    setError(null)

    try {
      setApplications(await listSsoApplications())
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load applications"
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    listSsoApplications()
      .then((items) => {
        if (!cancelled) setApplications(items)
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load applications"
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const payload = toSsoApplicationPayload(form)
      const saved = form.id
        ? await updateSsoApplication(form.id, payload)
        : await createSsoApplication(payload)

      await refresh()
      setForm(toSsoApplicationFormState(saved))
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save application"
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedApplication) return
    if (
      !window.confirm(
        `Delete ${selectedApplication.name}? Existing grants will be revoked.`
      )
    ) {
      return
    }

    setSaving(true)
    setError(null)

    try {
      await deleteSsoApplication(selectedApplication.id)
      setForm(defaultFormState)
      await refresh()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to delete application"
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-3 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">SSO Applications</h1>
          <p className="text-muted-foreground text-sm">
            Manage the apps allowed to authenticate through Gorth SSO.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setForm(defaultFormState)}
        >
          New application
        </Button>
      </section>

      {error ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="overflow-hidden rounded-lg border">
          <div className="bg-muted/50 text-muted-foreground grid grid-cols-[1.2fr_1fr_96px] border-b px-3 py-2 text-xs font-medium">
            <span>Name</span>
            <span>Client ID</span>
            <span>Status</span>
          </div>
          {loading ? (
            <div className="text-muted-foreground p-4 text-sm">
              Loading applications...
            </div>
          ) : applications.length === 0 ? (
            <div className="text-muted-foreground p-4 text-sm">
              No applications yet.
            </div>
          ) : (
            applications.map((application) => (
              <button
                key={application.id}
                type="button"
                onClick={() => setForm(toSsoApplicationFormState(application))}
                className="hover:bg-muted/60 grid w-full grid-cols-[1.2fr_1fr_96px] gap-3 border-b px-3 py-3 text-left text-sm last:border-b-0"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {application.name}
                  </span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {application.homepageUrl ?? "No homepage"}
                  </span>
                </span>
                <span className="truncate font-mono text-xs">
                  {application.clientId}
                </span>
                <span
                  className={
                    application.disabled
                      ? "text-destructive"
                      : "text-emerald-600"
                  }
                >
                  {application.disabled ? "Disabled" : "Enabled"}
                </span>
              </button>
            ))
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-lg border p-4"
        >
          <div>
            <h2 className="text-base font-semibold">
              {selectedApplication ? "Edit application" : "New application"}
            </h2>
            <p className="text-muted-foreground text-xs">
              Redirect URI is required. Multiple values can be separated by new
              lines.
            </p>
          </div>

          <label className="grid gap-1 text-sm">
            <span className="font-medium">Client ID</span>
            <Input
              value={form.clientId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  clientId: event.target.value,
                }))
              }
              placeholder="gorth-video-streaming-platform"
              disabled={Boolean(selectedApplication)}
              required
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium">Name</span>
            <Input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Gorth Video Streaming Platform"
              required
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium">Homepage URL</span>
            <Input
              value={form.homepageUrl}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  homepageUrl: event.target.value,
                }))
              }
              placeholder="http://localhost:8083"
            />
          </label>

          <TextareaField
            label="Redirect URIs"
            value={form.redirectUris}
            onChange={(value) =>
              setForm((current) => ({ ...current, redirectUris: value }))
            }
          />

          <TextareaField
            label="Post logout redirect URIs"
            value={form.postLogoutRedirectUris}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                postLogoutRedirectUris: value,
              }))
            }
          />

          <TextareaField
            label="Scopes"
            value={form.scopes}
            rows={3}
            onChange={(value) =>
              setForm((current) => ({ ...current, scopes: value }))
            }
          />

          <div className="grid gap-2">
            <CheckboxField
              label="Public client"
              checked={form.public}
              onChange={(checked) =>
                setForm((current) => ({ ...current, public: checked }))
              }
            />
            <CheckboxField
              label="Require PKCE"
              checked={form.requirePKCE}
              onChange={(checked) =>
                setForm((current) => ({ ...current, requirePKCE: checked }))
              }
            />
            <CheckboxField
              label="Skip consent"
              checked={form.skipConsent}
              onChange={(checked) =>
                setForm((current) => ({ ...current, skipConsent: checked }))
              }
            />
            <CheckboxField
              label="Disabled"
              checked={form.disabled}
              onChange={(checked) =>
                setForm((current) => ({ ...current, disabled: checked }))
              }
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : selectedApplication
                  ? "Save changes"
                  : "Create application"}
            </Button>
            {selectedApplication ? (
              <Button
                type="button"
                variant="destructive"
                disabled={saving}
                onClick={() => void handleDelete()}
              >
                Delete
              </Button>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  )
}
