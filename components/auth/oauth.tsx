"use client"

import { type FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@gorth/primitive/custom/button"
import { Badge } from "@gorth/primitive/custom/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gorth/primitive/default/card"
import { Checkbox } from "@gorth/primitive/default/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@gorth/primitive/custom/command"
import { StatusInput as Input } from "@gorth/primitive/custom/input-status"
import { Label } from "@gorth/primitive/default/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@gorth/primitive/default/popover"
import {
  Select,
  SelectGroup,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gorth/primitive/custom/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@gorth/primitive/default/table"
import { Textarea } from "@gorth/primitive/default/textarea"
import {
  Check,
  ChevronDown,
  Plus,
  Trash2,
  X,
} from "@gorth/primitive/cores/lucide"
import { LoadingScreen } from "@/features/shared/loading"
import {
  type SsoApplication,
  useCreateSsoApplicationMutation,
  useDeleteSsoApplicationMutation,
  useSsoApplicationQuery,
  useUpdateSsoApplicationMutation,
  type OAuthResource,
  useOAuthResourceQuery,
  useCreateOAuthResourceMutation,
  useUpdateOAuthResourceMutation,
} from "@/services/client/admin"
import {
  toSsoApplicationFormState,
  toSsoApplicationPayload,
  type SsoApplicationFormState,
} from "@/utils/client/temp"
import { oauthAdminPaths } from "@/utils/constant"
import {
  oauthSigningAlgorithms,
  toOAuthResourceFormState,
  toOAuthResourcePayload,
  type OAuthResourceFormState,
} from "@/utils/client/oauth"

const emptyApplication: SsoApplicationFormState = {
  id: "",
  clientId: "",
  name: "",
  description: "",
  homepageUrl: "",
  icon: "",
  redirectUris: [""],
  postLogoutRedirectUris: [],
  scopes: ["openid", "profile", "email", "offline_access"],
  grantTypes: ["authorization_code", "refresh_token"],
  responseTypes: ["code"],
  public: true,
  requirePKCE: true,
  tokenEndpointAuthMethod: "none",
  skipConsent: true,
  disabled: false,
}

const scopeOptions = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "chat:read",
  "chat:write",
  "video:read",
  "video:write",
  "reader:read",
  "reader:write",
  "social:read",
  "social:write",
  "task:read",
  "task:write",
  "marketplace:read",
  "marketplace:write",
] as const

const grantTypeOptions = [
  "authorization_code",
  "refresh_token",
  "client_credentials",
] as const

const responseTypeOptions = ["code"] as const

const tokenEndpointAuthMethodOptions = [
  "none",
  "client_secret_basic",
  "client_secret_post",
] as const

export function ApplicationEditor({ id }: { id: string }) {
  const applicationQuery = useSsoApplicationQuery(id)
  const application = applicationQuery.data
  const error = applicationQuery.error?.message

  if (applicationQuery.isLoading) return <LoadingScreen />
  if (error || !application)
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error ?? "Application not found"}
      </div>
    )

  return <ApplicationForm key={application.id} application={application} />
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
  const [createApplication, createResult] = useCreateSsoApplicationMutation()
  const [updateApplication, updateResult] = useUpdateSsoApplicationMutation()
  const [deleteApplication, deleteResult] = useDeleteSsoApplicationMutation()
  const saving =
    createResult.isLoading || updateResult.isLoading || deleteResult.isLoading
  const error = createResult.error ?? updateResult.error ?? deleteResult.error

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      const payload = toSsoApplicationPayload(form)
      const saved = application
        ? await updateApplication({ id: application.id, payload }).unwrap()
        : await createApplication(payload).unwrap()
      router.replace(`${oauthAdminPaths.client}/edit/${saved.id}`)
      router.refresh()
    } catch {
      // Caller exposes the normalized error through the mutation result.
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
    try {
      await deleteApplication(application.id).unwrap()
      router.replace(oauthAdminPaths.client)
      router.refresh()
    } catch {
      // Caller exposes the normalized error through the mutation result.
    }
  }

  function update<Key extends keyof SsoApplicationFormState>(
    key: Key,
    value: SsoApplicationFormState[Key]
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updateListItem(
    key: "redirectUris" | "postLogoutRedirectUris",
    index: number,
    value: string
  ) {
    update(
      key,
      form[key].map((item, itemIndex) => (itemIndex === index ? value : item))
    )
  }

  function appendListItem(key: "redirectUris" | "postLogoutRedirectUris") {
    update(key, [...form[key], ""])
  }

  function removeListItem(
    key: "redirectUris" | "postLogoutRedirectUris",
    index: number
  ) {
    update(
      key,
      form[key].filter((_, itemIndex) => itemIndex !== index)
    )
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <form onSubmit={submit} className="space-y-6">
        <div className="flex flex-wrap justify-end gap-2">
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(oauthAdminPaths.client)}
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
            <Button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : application
                  ? "Save changes"
                  : "Create application"}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error.message}
          </div>
        ) : null}

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
          <div className="grid min-w-0 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Application details</CardTitle>
                <CardDescription>
                  Basic client information shown throughout the SSO dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <TextField label="Client ID">
                  <Input
                    value={form.clientId}
                    placeholder="Generated by Better Auth"
                    disabled
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
                    type="url"
                    value={form.homepageUrl}
                    onChange={(event) =>
                      update("homepageUrl", event.target.value)
                    }
                  />
                </TextField>
                <TextField label="Icon URL">
                  <Input
                    type="url"
                    value={form.icon}
                    onChange={(event) => update("icon", event.target.value)}
                  />
                </TextField>
                <div className="md:col-span-2">
                  <TextAreaField
                    label="Description"
                    value={form.description}
                    onChange={(value) => update("description", value)}
                  />
                </div>
              </CardContent>
            </Card>

            <UriTableField
              title="Redirect URIs"
              description="Allowed callback destinations after authorization."
              values={form.redirectUris}
              required
              onAdd={() => appendListItem("redirectUris")}
              onChange={(index, value) =>
                updateListItem("redirectUris", index, value)
              }
              onRemove={(index) => removeListItem("redirectUris", index)}
            />

            <UriTableField
              title="Post logout redirect URIs"
              description="Allowed destinations after an SSO session ends."
              values={form.postLogoutRedirectUris}
              onAdd={() => appendListItem("postLogoutRedirectUris")}
              onChange={(index, value) =>
                updateListItem("postLogoutRedirectUris", index, value)
              }
              onRemove={(index) =>
                removeListItem("postLogoutRedirectUris", index)
              }
            />
          </div>

          <Card className="xl:sticky xl:top-6">
            <CardHeader>
              <CardTitle>OAuth configuration</CardTitle>
              <CardDescription>
                Protocol capabilities and client security behavior.
              </CardDescription>
            </CardHeader>
            <CardContent className="gap-5">
              <MultiSelectField
                label="Scopes"
                placeholder="Select scopes"
                options={scopeOptions}
                value={form.scopes}
                onChange={(value) => update("scopes", value)}
              />
              <MultiSelectField
                label="Grant types"
                placeholder="Select grant types"
                options={grantTypeOptions}
                value={form.grantTypes}
                onChange={(value) => update("grantTypes", value)}
              />
              <MultiSelectField
                label="Response types"
                placeholder="Select response types"
                options={responseTypeOptions}
                value={form.responseTypes}
                onChange={(value) => update("responseTypes", value)}
              />
              <TextField label="Token endpoint auth method">
                <Select
                  value={form.tokenEndpointAuthMethod}
                  onValueChange={(value) => {
                    update("tokenEndpointAuthMethod", value ?? "none")
                    update("public", value === "none")
                  }}
                  disabled={Boolean(application)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {tokenEndpointAuthMethodOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </TextField>

              <div className="grid gap-3 pt-1">
                {(
                  [
                    [
                      "public",
                      "Public client",
                      "Derived from the token endpoint authentication method.",
                    ],
                    [
                      "requirePKCE",
                      "Require PKCE",
                      "Require a code verifier for authorization code exchange.",
                    ],
                    [
                      "skipConsent",
                      "Skip consent",
                      "Allow this trusted client to bypass the consent screen.",
                    ],
                    [
                      "disabled",
                      "Disabled",
                      "Prevent this client from starting new OAuth flows.",
                    ],
                  ] as const
                ).map(([key, label, description]) => (
                  <Label
                    key={key}
                    className="flex items-start gap-3 rounded-lg border p-3 font-normal"
                  >
                    <Checkbox
                      className="mt-0.5"
                      checked={form[key]}
                      onCheckedChange={(checked) =>
                        update(key, Boolean(checked))
                      }
                      disabled={
                        key === "public" ||
                        (Boolean(application) && key === "requirePKCE")
                      }
                    />
                    <span className="grid gap-1">
                      <span className="font-medium">{label}</span>
                      <span className="text-xs leading-relaxed text-muted-foreground">
                        {description}
                      </span>
                    </span>
                  </Label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}

export function OAuthResourceEditor({ id }: { id: string }) {
  const resourceQuery = useOAuthResourceQuery(id)
  if (resourceQuery.isLoading) return <LoadingScreen />
  if (resourceQuery.error || !resourceQuery.data)
    return (
      <div
        role="alert"
        className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      >
        {resourceQuery.error?.message ?? "Resource not found"}
      </div>
    )
  return (
    <OAuthResourceForm
      key={resourceQuery.data.id}
      resource={resourceQuery.data}
    />
  )
}

export function OAuthResourceForm({ resource }: { resource?: OAuthResource }) {
  const router = useRouter()
  const [form, setForm] = useState(() => toOAuthResourceFormState(resource))
  const [createResource, createResult] = useCreateOAuthResourceMutation()
  const [updateResource, updateResult] = useUpdateOAuthResourceMutation()
  const saving = createResult.isLoading || updateResult.isLoading
  const error = createResult.error ?? updateResult.error

  function update<Key extends keyof OAuthResourceFormState>(
    key: Key,
    value: OAuthResourceFormState[Key]
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    try {
      const payload = toOAuthResourcePayload(form)
      const saved = resource
        ? await updateResource({ id: resource.id, payload }).unwrap()
        : await createResource(payload).unwrap()
      router.replace(`${oauthAdminPaths.resource}/edit/${saved.id}`)
      router.refresh()
    } catch {
      // Caller exposes the normalized error through the mutation result.
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(oauthAdminPaths.resource)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : resource ? "Save changes" : "Create resource"}
        </Button>
      </div>
      {error ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error.message}
        </div>
      ) : null}
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resource details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <TextField label="Name" id="resource-name">
              <Input
                id="resource-name"
                value={form.name}
                required
                maxLength={255}
                onChange={(event) => update("name", event.target.value)}
              />
            </TextField>
            <TextField
              label="Audience / resource identifier"
              id="resource-identifier"
            >
              <Input
                id="resource-identifier"
                type="url"
                value={form.identifier}
                required
                disabled={Boolean(resource)}
                placeholder="https://service.example.com"
                onChange={(event) => update("identifier", event.target.value)}
              />
            </TextField>
            <p className="text-sm text-muted-foreground">
              The audience cannot be renamed after creation. Apps must request
              this exact identifier to use the service.
            </p>
            <TextField
              label="Access token TTL (seconds)"
              id="resource-access-ttl"
            >
              <Input
                id="resource-access-ttl"
                type="number"
                min={1}
                max={2147483647}
                step={1}
                value={form.accessTokenTtl}
                placeholder="Provider default"
                onChange={(event) =>
                  update("accessTokenTtl", event.target.value)
                }
              />
            </TextField>
            <TextField
              label="Refresh token TTL (seconds)"
              id="resource-refresh-ttl"
            >
              <Input
                id="resource-refresh-ttl"
                type="number"
                min={1}
                max={2147483647}
                step={1}
                value={form.refreshTokenTtl}
                placeholder="Provider default"
                onChange={(event) =>
                  update("refreshTokenTtl", event.target.value)
                }
              />
            </TextField>
            <TextField label="Signing algorithm" id="resource-algorithm">
              <Select
                value={form.signingAlgorithm || "default"}
                onValueChange={(value) =>
                  update(
                    "signingAlgorithm",
                    oauthSigningAlgorithms.find(
                      (algorithm) => algorithm === value
                    ) ?? ""
                  )
                }
              >
                <SelectTrigger id="resource-algorithm" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="default">Provider default</SelectItem>
                    {oauthSigningAlgorithms.map((algorithm) => (
                      <SelectItem key={algorithm} value={algorithm}>
                        {algorithm}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </TextField>
            <TextField label="Signing key ID" id="resource-key-id">
              <Input
                id="resource-key-id"
                value={form.signingKeyId}
                placeholder="Provider default"
                onChange={(event) => update("signingKeyId", event.target.value)}
              />
            </TextField>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>OAuth policy</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Label className="flex items-center gap-2">
              <Checkbox
                checked={form.restrictScopes}
                onCheckedChange={(checked) =>
                  update("restrictScopes", Boolean(checked))
                }
              />
              Restrict allowed scopes
            </Label>
            {form.restrictScopes ? (
              <MultiSelectField
                label="Allowed scopes"
                placeholder="Select scopes"
                options={[
                  ...scopeOptions,
                  "sso:read",
                  "sso:write",
                  "storage:sso:credential",
                ]}
                value={form.allowedScopes}
                onChange={(value) => update("allowedScopes", value)}
              />
            ) : null}
            <p className="text-sm text-muted-foreground">
              An empty restricted list denies all scopes. Turning off the
              restriction leaves scope validation to the provider and client
              policy; it does not grant access by itself.
            </p>
            <Label className="flex items-center gap-2">
              <Checkbox
                checked={form.dpopBoundAccessTokensRequired}
                onCheckedChange={(checked) =>
                  update("dpopBoundAccessTokensRequired", Boolean(checked))
                }
              />
              Require DPoP-bound access tokens
            </Label>
            <Label className="flex items-center gap-2">
              <Checkbox
                checked={form.disabled}
                onCheckedChange={(checked) =>
                  update("disabled", Boolean(checked))
                }
              />
              Disabled
            </Label>
            <p className="text-sm text-muted-foreground">
              This form changes token policy only. It does not deploy a service,
              configure storage credentials or automatically link existing
              clients.
            </p>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}

function TextField({
  label,
  children,
  id,
}: {
  label: string
  children: React.ReactNode
  id?: string
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
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

function MultiSelectField({
  label,
  placeholder,
  options,
  value,
  onChange,
}: {
  label: string
  placeholder: string
  options: readonly string[]
  value: string[]
  onChange: (value: string[]) => void
}) {
  const allOptions = useMemo(
    () => Array.from(new Set([...options, ...value])),
    [options, value]
  )

  function toggle(option: string) {
    onChange(
      value.includes(option)
        ? value.filter((item) => item !== option)
        : [...value, option]
    )
  }

  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="h-auto min-h-10 w-full justify-between px-2 py-1.5 font-normal"
            />
          }
        >
          <span className="flex min-w-0 flex-1 flex-wrap gap-1">
            {value.length ? (
              value.map((item) => (
                <Badge key={item} variant="secondary" className="gap-1">
                  {item}
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Remove ${item}`}
                    className="cursor-pointer hover:text-destructive"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      toggle(item)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        event.stopPropagation()
                        toggle(item)
                      }
                    }}
                  >
                    <X className="size-3" />
                  </span>
                </Badge>
              ))
            ) : (
              <span className="px-1 text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-(--anchor-width) p-0">
          <Command>
            <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandGroup>
                {allOptions.map((option) => {
                  const selected = value.includes(option)
                  return (
                    <CommandItem
                      key={option}
                      value={option}
                      showCheck={false}
                      onSelect={() => toggle(option)}
                    >
                      <span
                        className={`flex size-4 items-center justify-center rounded-sm border ${
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input"
                        }`}
                      >
                        {selected ? <Check className="size-3" /> : null}
                      </span>
                      {option}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function UriTableField({
  title,
  description,
  values,
  required = false,
  onAdd,
  onChange,
  onRemove,
}: {
  title: string
  description: string
  values: string[]
  required?: boolean
  onAdd: () => void
  onChange: (index: number, value: string) => void
  onRemove: (index: number) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Button type="button" variant="outline" size="sm" onClick={onAdd}>
            <Plus className="size-4" /> Add row
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">URL</TableHead>
              <TableHead className="w-20 pr-6 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {values.length ? (
              values.map((value, index) => (
                <TableRow key={`${title}-${index}`}>
                  <TableCell className="py-2 pl-6">
                    <Input
                      type="url"
                      value={value}
                      placeholder="https://example.com/auth/exchange"
                      aria-label={`${title} row ${index + 1}`}
                      required={required}
                      onChange={(event) => onChange(index, event.target.value)}
                    />
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={required && values.length === 1}
                      aria-label={`Remove ${title} row ${index + 1}`}
                      onClick={() => onRemove(index)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="h-20 text-center text-muted-foreground"
                >
                  No URLs added. Use Add row to create one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
