import React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Dashbar as Container } from "@gorth/primitive/layouts/dashbar"
import { Separator } from "@gorth/primitive/default/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@gorth/primitive/default/tooltip"
import { SidebarTrigger } from "@gorth/primitive/custom/sidebar"
import { ModeSwitcher } from "@gorth/primitive/element/mode-toggle"
import { auth } from "@/lib/auth"
import { mainDashbar } from "@/lib/utils/constant"
import { NavUser } from "@gorth/primitive/dashboard/nav-user"

export function Dashbar() {
  const router = useRouter()
  const authControls = {
    loading: false,
    authenticated: true,
    login: (returnTo?: string) => {
      router.push(`/auth/sign-in${returnTo ? `?redirect=${encodeURIComponent(returnTo)}` : ""}`)
    },
    register: (returnTo?: string) => {
      router.push(`/auth/sign-up${returnTo ? `?redirect=${encodeURIComponent(returnTo)}` : ""}`)
    },
    logout: async (returnTo?: string) => {
      await auth.signOut()
      router.push(returnTo ?? "/auth/sign-in")
    },
  }

  return (
    <Container
      auth={authControls}
      nav={{
        main: mainDashbar.navMain,
        secondary: mainDashbar.navSecondary,
        navigation: mainDashbar.navDropdown
      }}
      left={
        <>
          <Tooltip>
            <TooltipTrigger
              render={<SidebarTrigger className="size-9 rounded-md" />}
            />
            <TooltipContent side="left">
              <p>Add to library</p>
            </TooltipContent>
          </Tooltip>
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />

          <div className="mr-4 flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                className="w-9 h-9"
                src="/favicon.ico"
                alt={""}
                width={36}
                height={36}
              />
              <span className="text-lg font-bold hidden md:inline-block">{"Japtor"}</span>
            </Link>
          </div>
        </>
      }
      right={
        <>
          <ModeSwitcher/>
          <NavUser
            user={{
              name: "japtor",
              email: "japtor@gorth.org",
              avatar: "/avatar/waddles.jpeg",
            }}
            type="navbar"
            side="bottom"
            align="end"
            size="icon"
            auth={authControls}
            nav={{
              main: mainDashbar.navDropdown,
              secondary: mainDashbar.navSignal
            }}
          />
        </>
      }
    />
  )
}
