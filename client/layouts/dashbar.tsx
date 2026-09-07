"use client"

import Link from "next/link"
import { Header } from "@gorth/primitive/layouts/header"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@gorth/primitive/default/tooltip"
import { SidebarTrigger } from "@gorth/primitive/custom/sidebar"
import { ModeSwitcher } from "@gorth/primitive/element/mode-toggle"
import { mainHeader } from "@/lib/utils/constant"
import type { AuthContextProps } from "@/hooks/use-auth"

export function Dashbar({ auth }: { auth: AuthContextProps }) {
  const accountName = auth.account?.name || "Account"
  const accountEmail = auth.account?.email || ""

  return (
    <Header
      mode="dashboard"
      auth={auth}
      user={{
        name: accountName,
        email: accountEmail,
        avatar: auth.account?.image ?? mainHeader.user.avatar,
      }}
      nav={{
        main: mainHeader.navDropdown,
        secondary: mainHeader.navSignal,
        navigation: mainHeader.navSecondary,
      }}
      left={
        <>
          <Tooltip>
            <TooltipTrigger
              render={<SidebarTrigger className="size-9 rounded-md" />}
            />
            <TooltipContent side="left">
              <p>Sidebar</p>
            </TooltipContent>
          </Tooltip>
        </>
      }

    />
  )
}
