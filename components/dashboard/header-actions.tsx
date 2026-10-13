"use client"

import type { ComponentProps } from "react"
import type { Header } from "@gorth/primitive/layouts/header"
import { ModeSwitcher } from "@gorth/primitive/element/mode-toggle"
import { Customizer } from "@gorth/primitive/element/customizer"
import { Shortcut } from "@gorth/primitive/element/shortcut"
import { NavUser } from "@/components/dashboard/nav-user"

export function HeaderActions({
  user,
  auth,
  nav,
}: Pick<ComponentProps<typeof Header>, "user" | "auth" | "nav">) {
  return (
    <>
      <ModeSwitcher />
      <Customizer />
      {nav.navigation?.length ? <Shortcut shortcuts={nav.navigation} /> : null}
      <NavUser
        user={user}
        auth={auth}
        nav={nav}
        type="navbar"
        side="bottom"
        align="end"
        size="icon"
      />
    </>
  )
}
