"use client"

import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { SidebarProvider } from "@gorth/primitive/custom/sidebar"
import { Footer } from "@gorth/primitive/layouts/footer"
import { Header } from "@gorth/primitive/layouts/header"
import gorthLogo from "/public/logo/gorth.png"
import { useAuth } from "@/hooks/use-auth"
import { useUser } from "@/hooks/use-user"
import { Copyright } from "@/layouts/copyright"
import { mainFooter, mainHeader } from "@/utils/constant"
import { HeaderActions } from "@/components/dashboard/header-actions"

export default function SharedLayout({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const user = useUser()
  const nav = {
    main: mainHeader.navDropdown,
    secondary: mainHeader.navSignal,
    navigation: mainHeader.navSecondary,
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-svh flex-1 flex-col bg-background text-foreground">
        <Header
          auth={auth}
          user={user}
          nav={nav}
          right={<HeaderActions user={user} auth={auth} nav={nav} />}
          bottom={
            <Link
              href="/"
              aria-label="Gorth home"
              className="block size-9 shrink-0"
            >
              <Image
                src={gorthLogo}
                alt="Gorth"
                width={36}
                height={36}
                className="size-9 object-contain"
              />
            </Link>
          }
        />

        <main className="flex flex-1 flex-col">
          <div className="container mx-auto flex-1 p-6">{children}</div>
        </main>

        <Footer
          nav={{
            main: mainFooter.navDropdown,
            secondary: [],
          }}
          top={
            <Link href="/" aria-label="Gorth home" className="flex items-center gap-3">
              <Image
                src={gorthLogo}
                alt="Gorth"
                width={96}
                height={96}
                className="size-24 object-contain"
              />
              <span className="truncate text-2xl font-bold tracking-tight text-foreground">
                Gorth
              </span>
            </Link>
          }
          middle={
            <p className="max-w-xs leading-6">
              One secure identity for every application your team uses. Simple
              access, centralized control, and fewer interruptions.
            </p>
          }
          bottom={<Copyright />}
        />
      </div>
    </SidebarProvider>
  )
}
