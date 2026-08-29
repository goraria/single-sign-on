import { getFormErrorMessage } from "@/lib/utils/formatter"

export function FieldError({ errors }: { errors: unknown[] }) {
  const message = errors.map(getFormErrorMessage).find(Boolean)
  if (!message) return null
  return <p className="text-destructive text-sm">{message}</p>
}
