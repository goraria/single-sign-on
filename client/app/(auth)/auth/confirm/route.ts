import { redirect } from "next/navigation"
import type { NextRequest } from "next/server"
import { resolveInternalPath } from "@/lib/utils/formatter"

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  redirect(resolveInternalPath(searchParams.get("next")))
}
