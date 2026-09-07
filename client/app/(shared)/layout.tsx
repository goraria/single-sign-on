"use client"

import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@gorth/primitive/custom/button"
import { SidebarProvider } from "@gorth/primitive/custom/sidebar"
import { Footer } from "@gorth/primitive/layouts/footer"
import { Header } from "@gorth/primitive/layouts/header"
import gorthLogo from "@/assets/gorth.png"
import { useAuth } from "@/hooks/use-auth"
import { useUser } from "@/hooks/use-user"
import { Copyright } from "@/layouts/copyright"
import { mainFooter, mainHeader } from "@/lib/utils/constant"

export default function SharedLayout({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const user = useUser()

  return (
    <SidebarProvider>
      <div className="bg-background text-foreground flex min-h-svh flex-1 flex-col">
        <Header
          auth={auth}
          user={user}
          nav={{
            main: mainHeader.navDropdown,
            secondary: mainHeader.navSignal,
            navigation: mainHeader.navSecondary,
          }}
          bottom={
            <Button
              nativeButton={false}
              render={<Link href="/" />}
              variant="ghost"
              className="px-0 text-lg font-bold hover:bg-transparent"
            >
              Gorth
            </Button>
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
            <Link href="/" aria-label="Gorth home" className="block size-24">
              <Image
                src={gorthLogo}
                alt="Gorth"
                width={96}
                height={96}
                className="size-24 object-contain"
              />
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
