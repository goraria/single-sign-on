import "server-only"

import { cache } from "react"
import { headers } from "next/headers"
import { getRouteSession } from "@/services/route"

export const verifySession = cache(async () => {
  return getRouteSession((await headers()).get("cookie") ?? "")
})

export const getUser = cache(async () => {
  const session = await verifySession()
  if (!session?.user) return null
  return session.user
})
