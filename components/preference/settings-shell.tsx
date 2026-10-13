"use client"

import type { ReactNode } from "react"
import {
  Monitor,
  Palette,
  UserCog,
  Wrench,
} from "@gorth/primitive/cores/lucide"
import { Separator } from "@gorth/primitive/default/separator"
import { SidebarNav, type PreferenceNavItem } from "./sidebar-nav"

const preferenceItems: PreferenceNavItem[] = [
  { title: "Profile", href: "/settings/profile", icon: UserCog },
  { title: "Account", href: "/settings/account", icon: Wrench },
  { title: "Appearance", href: "/settings/appearance", icon: Palette },
  { title: "Display", href: "/settings/display", icon: Monitor },
]

export function SettingsShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account settings and set e-mail preferences.
        </p>
      </div>
      <Separator className="my-4 flex-none lg:my-6" />
      <div className="flex min-h-0 flex-1 flex-col space-y-2 overflow-hidden md:flex-row md:space-y-0 md:space-x-12">
        <aside className="top-0 flex-none md:sticky md:w-1/5">
          <SidebarNav items={preferenceItems} />
        </aside>
        <div className="flex min-h-0 w-full min-w-0 flex-1 overflow-hidden p-1">
          {children}
        </div>
      </div>
    </div>
  )
}
