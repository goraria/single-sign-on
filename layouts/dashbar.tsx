"use client"

import { Header } from "@gorth/primitive/layouts/header"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@gorth/primitive/default/tooltip"
import { SidebarTrigger } from "@gorth/primitive/custom/sidebar"
import { HeaderActions } from "@/components/dashboard/header-actions"
import { mainHeader } from "@/utils/constant"
import type { AuthContextProps } from "@/hooks/use-auth"

export function Dashbar({ auth }: { auth: AuthContextProps }) {
  const accountName = auth.account?.name || "Account"
  const accountEmail = auth.account?.email || ""
  const user = {
    name: accountName,
    email: accountEmail,
    avatar: auth.account?.image ?? mainHeader.user.avatar,
  }
  const nav = {
    main: mainHeader.navDropdown,
    secondary: mainHeader.navSignal,
    navigation: mainHeader.navSecondary,
  }

  return (
    <Header
      mode="dashboard"
      auth={auth}
      user={user}
      nav={nav}
      right={<HeaderActions user={user} auth={auth} nav={nav} />}
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
