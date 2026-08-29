"use client"

import { useAuth } from "@/hooks/use-auth"
import { visitor } from "@/lib/utils/constant"
import type { UserRole } from "@/lib/utils/formatter"

export interface User {
  name: string
  email: string
  avatar: string
  role: UserRole
}

export function useUser(): User {
  const { account } = useAuth()

  if (!account) return visitor

  return {
    name: account.name,
    email: account.email,
    avatar: account.image ?? "",
    role: account.role,
  }
}
