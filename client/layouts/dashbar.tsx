"use client"

import Link from "next/link"
import { Dashbar as Container } from "@gorth/primitive/layouts/dashbar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@gorth/primitive/default/tooltip"
import { SidebarTrigger } from "@gorth/primitive/custom/sidebar"
import { ModeSwitcher } from "@gorth/primitive/element/mode-toggle"
import { mainDashbar } from "@/lib/utils/constant"
import type { AuthContextProps } from "@/hooks/use-auth"

export function Dashbar({ auth }: { auth: AuthContextProps }) {
  const accountName = auth.account?.name || "Account"
  const accountEmail = auth.account?.email || ""

  return (
    <Container
      auth={auth}
      user={{
        name: accountName,
        email: accountEmail,
        avatar: auth.account?.image ?? mainDashbar.user.avatar,
      }}
      nav={{
        main: mainDashbar.navDropdown,
        secondary: mainDashbar.navSecondary,
        navigation: mainDashbar.navDropdown,
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
