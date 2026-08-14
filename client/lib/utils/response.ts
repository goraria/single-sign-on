import { NextResponse } from "next/server"
import type { SsoUser } from "@/lib/utils/interface"

export function buildUserResponse(user: SsoUser) {
  return NextResponse.json({
    user,
    sso_sub: user.id,
    email: user.email,
  })
}
