"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// The dashboard page keeps its spinner mounted until the destination commits.
export function DashboardNavigation({ href }: { href: string }) {
  const router = useRouter()
  useEffect(() => {
    router.replace(href)
  }, [href, router])
  return null
}
