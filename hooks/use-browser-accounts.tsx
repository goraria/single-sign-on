"use client"

import { useEffect, useRef, useState } from "react"
import type { BrowserAccount } from "@/schemas/browser-account"
import {
  changeBrowserAccount,
  listBrowserAccounts,
} from "@/services/client/browser-account"

export function useBrowserAccounts(
  enabled: boolean,
  onActiveAccount: () => void
) {
  const [accounts, setAccounts] = useState<BrowserAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadVersion, setReloadVersion] = useState(0)
  const switching = useRef(false)

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    void listBrowserAccounts(controller.signal)
      .then(({ accounts: items }) => {
        if (!controller.signal.aborted) setAccounts(items)
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("Unable to load accounts. Please try again.")
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [enabled, reloadVersion])

  function reloadAccounts() {
    setAccounts([])
    setError(null)
    setLoading(true)
    setReloadVersion((value) => value + 1)
  }

  async function selectAccount(account: BrowserAccount) {
    if (switching.current || loading) return
    if (account.active) {
      onActiveAccount()
      return
    }
    switching.current = true
    setPendingSessionId(account.sessionId)
    setError(null)
    try {
      await changeBrowserAccount("switch", account.sessionId)
      // Discard account-scoped providers; the new account may not have Admin access.
      window.location.replace("/settings")
    } catch {
      switching.current = false
      setPendingSessionId(null)
      setError("Unable to switch accounts. Please try again.")
    }
  }

  return {
    accounts,
    loading,
    pendingSessionId,
    error,
    reloadAccounts,
    selectAccount,
  }
}
