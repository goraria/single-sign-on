import "server-only"

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto"
import type { SsoExchangeResponse } from "@/lib/utils/interface"

const AUTH_CODE_TTL_MS = 60 * 1000
const AUTH_CODE_VERSION = 1

type AuthorizationCodeRecord = {
  payload: SsoExchangeResponse
  expiresAt: number
  version: number
}

function getCodeSecret() {
  return (
    process.env.SSO_AUTH_CODE_SECRET ??
    process.env.NEXT_AUTH_SECRET ??
    "development-sso-auth-code-secret"
  )
}

function getCodeKey() {
  return createHash("sha256").update(getCodeSecret()).digest()
}

function encodeBase64Url(value: Buffer) {
  return value.toString("base64url")
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url")
}

export function createAuthorizationCode(payload: SsoExchangeResponse) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", getCodeKey(), iv)
  const record: AuthorizationCodeRecord = {
    payload,
    expiresAt: Date.now() + AUTH_CODE_TTL_MS,
    version: AUTH_CODE_VERSION,
  }
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(record), "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  return [
    encodeBase64Url(iv),
    encodeBase64Url(tag),
    encodeBase64Url(encrypted),
  ].join(".")
}

export function consumeAuthorizationCode(code: string) {
  const [ivValue, tagValue, encryptedValue] = code.split(".")

  if (!ivValue || !tagValue || !encryptedValue) {
    return null
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      getCodeKey(),
      decodeBase64Url(ivValue)
    )
    decipher.setAuthTag(decodeBase64Url(tagValue))

    const decrypted = Buffer.concat([
      decipher.update(decodeBase64Url(encryptedValue)),
      decipher.final(),
    ])
    const record = JSON.parse(decrypted.toString("utf8")) as AuthorizationCodeRecord

    if (
      record.version !== AUTH_CODE_VERSION ||
      record.expiresAt <= Date.now() ||
      !record.payload?.access_token ||
      !record.payload?.refresh_token
    ) {
      return null
    }

    return record.payload
  } catch {
    return null
  }
}
