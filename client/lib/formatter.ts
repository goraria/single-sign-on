

export const getAllowedOrigins = () =>
  ('http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

export const resolveRedirect = (value: string | null) => {
  if (!value) {
    return null
  }

  try {
    const target = new URL(value)
    if (!['http:', 'https:'].includes(target.protocol)) {
      return null
    }

    if (!getAllowedOrigins().includes(target.origin)) {
      return null
    }

    return target.toString()
  } catch {
    return null
  }
}
