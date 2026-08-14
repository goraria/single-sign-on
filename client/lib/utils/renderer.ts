export interface RenderAuthStateMeta {
  label: string
  className: string
}

export function renderAuthStateMeta(value: string | null | undefined): RenderAuthStateMeta {
  switch (value) {
    case "authenticated":
      return { label: "Authenticated", className: "text-emerald-700 bg-emerald-50" }
    case "unauthenticated":
      return { label: "Unauthenticated", className: "text-slate-700 bg-slate-100" }
    case "invalid_redirect":
    case "invalid_token":
      return { label: "Invalid", className: "text-red-700 bg-red-50" }
    default:
      return {
        label: value ? value.replace(/[-_]/g, " ") : "Unknown",
        className: "text-slate-700 bg-slate-100",
      }
  }
}

export function renderAuthProviderLabel(value: string | null | undefined) {
  switch (value) {
    case "google":
      return "Google"
    case "facebook":
      return "Facebook"
    case "microsoft":
      return "Microsoft"
    case "apple":
      return "Apple"
    case "email":
      return "Email"
    case "phone":
      return "Phone"
    default:
      return value ? value.replace(/[-_]/g, " ") : "Unknown"
  }
}
