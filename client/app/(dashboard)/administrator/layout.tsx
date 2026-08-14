"use client"

import React from "react"
import { useRouter } from "next/navigation"
import {
  SidebarProvider,
  SidebarInset,
} from "@gorth/primitive/custom/sidebar"
import { Dashbar } from "@/layouts/dashbar"
import { Copyright } from "@gorth/primitive/layouts/copyright"
import { AppSidebar } from "@gorth/primitive/dashboard/app-sidebar"
import { administratorSidebar } from "@/lib/utils/constant"
import { auth } from "@/lib/auth"

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
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
    <SidebarProvider>
      <AppSidebar data={administratorSidebar} auth={authControls} />

      <SidebarInset>
        <Dashbar/>
        <main className="flex flex-1 flex-col">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
        {/*<Copyright />*/}
      </SidebarInset>
    </SidebarProvider>
  )
}
