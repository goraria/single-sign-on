"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Loader2, LogOut, UserPlus } from "@gorth/primitive/cores/lucide"
import { Card, CardContent } from "@gorth/primitive/default/card"
import { NavIdentity } from "@gorth/primitive/dashboard/nav-user"
import { Button } from "@gorth/primitive/custom/button"
import { Separator } from "@gorth/primitive/default/separator"
import type { BrowserAccount } from "@/schemas/browser-account"
import { resolveInternalPath } from "@/utils/client/formatter"
import { defaultAuthRedirect } from "@/utils/constant"
import { hasOAuthQuery } from "@/utils/client/temp"
import {
  changeBrowserAccount,
  continueAccountSelection,
  listBrowserAccounts,
  logoutAllBrowserAccounts,
} from "@/services/client/browser-account"

export function BrowserAccounts() {
  const searchParams = useSearchParams()
  const query = searchParams.toString()
  const oauth = hasOAuthQuery(new URLSearchParams(query))
  const [accounts, setAccounts] = useState<BrowserAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const chooser = `/auth/select-account${oauth ? `?${query}` : ""}`
  const addAccount = `/auth/add-account?${oauth ? query : new URLSearchParams({ redirect: chooser }).toString()}`

  useEffect(() => {
    const controller = new AbortController()
    void listBrowserAccounts(controller.signal)
      .then(({ accounts: items }) => {
        if (!controller.signal.aborted) setAccounts(items)
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("Unable to load accounts. Please reload and try again.")
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])

  async function run(
    operation: "switch" | "revoke" | "all",
    account?: BrowserAccount
  ) {
    setBusy(true)
    setError(null)
    try {
      if (operation === "all") {
        await logoutAllBrowserAccounts()
        window.location.replace(chooser)
      } else if (account) {
        await changeBrowserAccount(operation, account.sessionId)
        if (operation === "switch" && oauth)
          await continueAccountSelection(query)
        else
          window.location.replace(
            operation === "switch"
              ? resolveInternalPath(
                  searchParams.get("redirect"),
                  defaultAuthRedirect
                )
              : chooser
          )
      }
    } catch {
      setError("Unable to complete this action. Please reload and try again.")
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-4" aria-busy={loading || busy}>
      {loading ? (
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Loader2 className="size-4 animate-spin" />
          Loading accounts...
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4">
        {accounts.map((account) => (
          <Card
            key={account.sessionId}
            className="flex min-w-0 items-center gap-2 p-2.5 rounded-lg"
          >
            <CardContent className="flex min-w-0 flex-row items-center justify-between w-full gap-2 p-0">
              <NavIdentity
                user={{
                  name: account.user.name,
                  avatar: account.user.image,
                  email: account.user.email,
                }}
              />
              <div className="flex shrink-0 items-center gap-2">
                {/* {account.active ? (
                  <Badge variant="success">
                    Active
                  </Badge>
                ) : null} */}
                {oauth ? (
                  <>
                    <Button
                      type="button"
                      className="h-9"
                      variant="outline"
                      disabled={loading || busy}
                      onClick={() => void run("switch", account)}
                    >
                      Continue
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      className="h-9"
                      variant="outline"
                      disabled={loading || busy}
                      onClick={() => void run("switch", account)}
                    >
                      Switch
                    </Button>
                    <Button
                      type="button"
                      className="size-9"
                      size="icon"
                      variant="default"
                      aria-label={`Sign out ${account.user.email}`}
                      disabled={loading || busy}
                      onClick={() => void run("revoke", account)}
                    >
                      <LogOut className="size-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {!loading && !error && !accounts.length ? (
        <p className="text-sm text-muted-foreground">
          No accounts signed in on this browser.
        </p>
      ) : null}
      <Separator />
      <Button
        nativeButton={false}
        className="h-9"
        variant="outline"
        disabled={loading || busy || accounts.length >= 5}
        render={<Link href={addAccount} />}
      >
        <UserPlus className="size-4" />
        Add another account
      </Button>
      {accounts.length >= 5 ? (
        <p className="text-xs text-muted-foreground">
          Sign out of an account before adding another. Up to 5 accounts are
          supported on this browser.
        </p>
      ) : null}
      {accounts.length ? (
        <Button
          type="button"
          className="h-9"
          variant="default"
          disabled={loading || busy}
          onClick={() => void run("all")}
        >
          <LogOut className="size-4" />
          Sign out of all accounts
        </Button>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Switching your SSO account does not switch accounts in apps that already
        have their own session.
      </p>
    </div>
  )
}
