import type { ReactNode } from "react"

import { IconDefault } from "@/assets/icon/brand/icon-default"

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container grid min-h-svh max-w-none items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-2 py-8 sm:p-8">
        <div className="mb-4 flex items-center justify-center">
          <IconDefault className="me-2 size-7" title="Gorth" />
          <h1 className="text-xl font-medium">Gorth</h1>
        </div>
        {children}
      </div>
    </div>
  )
}
