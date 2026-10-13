import { NextResponse } from "next/server"
import { copyUrlSearch } from "@/utils/client/formatter"

export function GET(request: Request) {
  const url = new URL(request.url)
  return NextResponse.redirect(
    copyUrlSearch(url, new URL("/auth/oauth", url.origin))
  )
}
