"use client"

interface Credential {
  id: string
  clientId: string
  secret: string
}
const credentials = new Map<string, { value: Credential; expires: number }>()
export function handoffOAuthCredential(value: Credential) {
  credentials.set(value.id, { value, expires: Date.now() + 60000 })
  setTimeout(() => credentials.delete(value.id), 60000)
}
export function readOAuthCredential(id: string) {
  const entry = credentials.get(id)
  return entry && entry.expires > Date.now() ? entry.value : null
}
export function forgetOAuthCredential(id: string) {
  credentials.delete(id)
}
