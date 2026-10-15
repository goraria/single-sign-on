"use client"

import { useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { SidebarInset, SidebarProvider } from "@gorth/primitive/custom/sidebar"
import { Footer } from "@gorth/primitive/layouts/footer"
import { AppSidebar } from "@gorth/primitive/dashboard/app-sidebar"
import type { SwitcherAccount } from "@gorth/primitive/dashboard/account-switcher"
import { LayoutDashboard } from "@gorth/primitive/cores/lucide"
import { Dashbar } from "@/layouts/dashbar"
import { Copyright } from "@/layouts/copyright"
import { useAuth } from "@/hooks/use-auth"
import { useUser } from "@/hooks/use-user"
import { useBrowserAccounts } from "@/hooks/use-browser-accounts"
import {
  adminSidebar,
  mainFooter,
  settingsSidebar,
  roleSidebars,
} from "@/utils/constant"

interface DashboardShellProps {
  children: ReactNode
  section: "admin" | "user" | "vice" | "settings"
}

export function DashboardShell({ children, section }: DashboardShellProps) {
  const isLogistics = usePathname() === "/admin/logistics"
  const auth = useAuth()
  const user = useUser()
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [accountsOpen, setAccountsOpen] = useState(false)
  const browserAccounts = useBrowserAccounts(
    accountsOpen && auth.authenticated,
    () => {
      setAccountMenuOpen(false)
      setAccountsOpen(false)
    }
  )
  const data =
    section === "admin"
      ? adminSidebar
      : section === "settings"
        ? settingsSidebar
        : roleSidebars[section]
  const sidebar = {
    ...data,
    user,
    navDropdown: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      ...data.navDropdown.filter((item) => item.url !== "/dashboard"),
    ],
    navMain:
      user.role === "master"
        ? [
            ...data.navMain,
            {
              title: "Role dashboards",
              url: "#",
              icon: adminSidebar.navMain[0].icon,
              items: [
                { title: "User", url: "/user" },
                { title: "Vice", url: "/vice" },
                { title: "Admin", url: "/admin" },
              ],
            },
          ]
        : data.navMain,
  }

  return (
    <SidebarProvider className="h-svh min-h-0 overflow-hidden">
      <AppSidebar
        data={sidebar}
        auth={auth}
        accountSwitcher={{
          open: accountMenuOpen,
          onOpenChange: setAccountMenuOpen,
          onAccountsOpenChange: setAccountsOpen,
          accounts: browserAccounts.accounts,
          loading: browserAccounts.loading,
          pendingSessionId: browserAccounts.pendingSessionId,
          error: browserAccounts.error,
          onSelect: (account: SwitcherAccount) =>
            void browserAccounts.selectAccount(account),
          onRetry: browserAccounts.reloadAccounts,
          addAccountHref: "/auth/add-account",
        }}
      />
      <SidebarInset
        className={
          isLogistics
            ? "min-h-0 min-w-0 overflow-hidden"
            : "min-h-0 min-w-0 overflow-x-hidden overflow-y-auto"
        }
      >
        <Dashbar auth={auth} />
        <main
          className={
            isLogistics
              ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
              : "flex min-w-0 flex-1 shrink-0 flex-col"
          }
        >
          <div className="container mx-auto flex min-h-0 w-full flex-1 flex-col p-6">
            {children}
          </div>
        </main>
        <Footer
          mode="dashboard"
          nav={{ main: mainFooter.navDropdown, secondary: [] }}
          bottom={<Copyright />}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
