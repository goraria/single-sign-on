"use client"

import { useState, type ComponentProps } from "react"
import { LayoutDashboard } from "@gorth/primitive/cores/lucide"
import { AccountSwitcher } from "@gorth/primitive/dashboard/account-switcher"
import { NavUser as PrimitiveNavUser } from "@gorth/primitive/dashboard/nav-user"
import { useBrowserAccounts } from "@/hooks/use-browser-accounts"

export function NavUser(props: ComponentProps<typeof PrimitiveNavUser>) {
  const [open, setOpen] = useState(false)
  const [accountsOpen, setAccountsOpen] = useState(false)
  const browserAccounts = useBrowserAccounts(
    accountsOpen && props.auth.authenticated,
    () => {
      setOpen(false)
      setAccountsOpen(false)
    }
  )

  return (
    <AccountSwitcher
      {...props}
      nav={{
        ...props.nav,
        main: [
          { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
          ...props.nav.main.filter((item) => item.url !== "/dashboard"),
        ],
      }}
      open={open}
      onOpenChange={setOpen}
      onAccountsOpenChange={setAccountsOpen}
      accounts={browserAccounts.accounts}
      loading={browserAccounts.loading}
      pendingSessionId={browserAccounts.pendingSessionId}
      error={browserAccounts.error}
      onSelect={(account) => void browserAccounts.selectAccount(account)}
      onRetry={browserAccounts.reloadAccounts}
      addAccountHref="/auth/add-account"
    />
  )
}
