"use client"

import { auth } from "@/lib/auth/client"
import { caller } from "@/utils/caller"
import { parseHttpUrl } from "@/utils/client/formatter"
import type { BrowserAccount } from "@/schemas/browser-account"
import type { OAuthTimeout } from "@/lib/auth/client/timeout"

export function prepareOAuthTimeout(oauthQuery: string, signal: AbortSignal) {
  return caller<OAuthTimeout>({
    url: "/auth/oauth-timeout",
    method: "POST",
    baseURL: null,
    auth: false,
    toast: false,
    credentials: "include",
    cache: "no-store",
    timeout: 10_000,
    signal,
    body: { oauth_query: oauthQuery },
  })
}

export function listBrowserAccounts(signal?: AbortSignal) {
  return caller<{ accounts: BrowserAccount[] }>({
    url: "/auth/browser-account",
    method: "GET",
    baseURL: null,
    auth: false,
    toast: false,
    credentials: "include",
    cache: "no-store",
    signal,
  })
}

export function changeBrowserAccount(
  operation: "switch" | "revoke",
  sessionId: string
) {
  return caller<{ ok: boolean }>({
    url: "/auth/browser-account",
    method: "POST",
    baseURL: null,
    auth: false,
    toast: false,
    credentials: "include",
    body: { operation, sessionId },
  })
}

export async function logoutCurrentBrowserAccount() {
  const { accounts } = await listBrowserAccounts()
  const current = accounts.find((item) => item.active)
  if (current) await changeBrowserAccount("revoke", current.sessionId)
}

export async function logoutAllBrowserAccounts() {
  const result = await auth.signOut()
  if (result.error) throw new Error("Unable to sign out of all accounts")
}

export async function continueAccountSelection(oauthQuery: string) {
  const result = await auth.oauth2.continue({
    selected: true,
    oauth_query: oauthQuery,
  })
  if (result.error) throw new Error("Unable to continue account selection")
  const data = result.data as { url?: string; redirect_uri?: string } | null
  const target = parseHttpUrl(
    data?.url ?? data?.redirect_uri ?? "",
    window.location.origin
  )
  if (
    !target ||
    target.username ||
    target.password ||
    (target.protocol !== "https:" &&
      !["localhost", "127.0.0.1", "[::1]"].includes(target.hostname))
  )
    throw new Error("Invalid authorization redirect")
  window.location.assign(target.href)
}
