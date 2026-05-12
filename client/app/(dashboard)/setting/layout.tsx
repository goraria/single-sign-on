"use client"

import React from "react"
import {
  SidebarProvider,
  SidebarInset,
} from "gorth-ui/custom/sidebar"
import { Dashbar } from "@/layouts/dashbar"
import { Copyright } from "gorth-ui/layouts/copyright"
import { AppSidebar } from "gorth-ui/dashboard/app-sidebar"
import { settingSidebar } from "@/lib/constant"

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider>
      <AppSidebar data={settingSidebar} />

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
