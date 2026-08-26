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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@gorth/primitive/custom/dropdown"
import { Button } from "@gorth/primitive/custom/button"
import { LogOut } from "@gorth/primitive/cores/lucide"
import type { AuthContextProps } from "@/hooks/use-auth"

function getAccountInitials(auth: AuthContextProps) {
  const value = auth.account?.name || auth.account?.email || "User"

  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

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
        main: mainDashbar.navMain,
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
              <p>Add to library</p>
            </TooltipContent>
          </Tooltip>
          {/*<Separator*/}
          {/*  orientation="vertical"*/}
          {/*  className="mr-2 data-[orientation=vertical]:h-4"*/}
          {/*/>*/}

          {/*<div className="mr-4 flex items-center">*/}
          {/*  <Link href="/" className="flex items-center space-x-2">*/}
          {/*    <Image*/}
          {/*      className="w-9 h-9"*/}
          {/*      src="/favicon.ico"*/}
          {/*      alt={""}*/}
          {/*      width={36}*/}
          {/*      height={36}*/}
          {/*    />*/}
          {/*    <span className="text-lg font-bold hidden md:inline-block">{"Japtor"}</span>*/}
          {/*  </Link>*/}
          {/*</div>*/}
        </>
      }
      right={
        <>
          <ModeSwitcher />
          {/*<NavUser*/}
          {/*  user={{*/}
          {/*    name: "japtor",*/}
          {/*    email: "japtor@gorth.org",*/}
          {/*    avatar: "/avatar/waddles.jpeg",*/}
          {/*  }}*/}
          {/*  type="navbar"*/}
          {/*  side="bottom"*/}
          {/*  align="end"*/}
          {/*  size="icon"*/}
          {/*  auth={authControls}*/}
          {/*  nav={{*/}
          {/*    main: mainDashbar.navDropdown,*/}
          {/*    secondary: mainDashbar.navSignal*/}
          {/*  }}*/}
          {/*/>*/}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="cursor-pointer p-0"
                />
              }
            >
              {getAccountInitials(auth)}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="min-w-56 rounded-lg"
              side="bottom"
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="grid text-left text-sm leading-tight">
                    <span className="truncate font-medium">{accountName}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {accountEmail}
                    </span>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {mainDashbar.navDropdown.map((item) => (
                  <DropdownMenuItem
                    key={item.url}
                    render={<Link href={item.url} />}
                  >
                    <item.icon className="size-4" />
                    {item.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => void auth.logout("/")}>
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
    />
  )
}
