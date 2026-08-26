export function AuthFieldError({ errors }: { errors: unknown[] }) {
  const message = errors.map(getErrorMessage).find(Boolean)
  if (!message) return null
  return <p className="text-destructive text-sm">{message}</p>
}

function getErrorMessage(error: unknown): string | null {
  if (typeof error === "string") return error
  if (!error || typeof error !== "object") return null

  if ("message" in error && typeof error.message === "string") {
    return error.message
  }

  if ("issues" in error && Array.isArray(error.issues)) {
    return error.issues.map(getErrorMessage).find(Boolean) ?? null
  }

  return (
    Object.values(error)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .map(getErrorMessage)
      .find(Boolean) ?? null
  )
}
