import { NextResponse } from "next/server"
import { consumeAuthorizationCode } from "@/lib/auth/code"

export const runtime = "nodejs"

export async function POST(req: Request) {
  let payload: unknown

  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
  }

  const code =
    typeof (payload as { code?: unknown }).code === "string"
      ? (payload as { code: string }).code.trim()
      : ""

  if (!code) {
    return NextResponse.json({ error: "missing_code" }, { status: 400 })
  }

  const exchangePayload = consumeAuthorizationCode(code)

  if (!exchangePayload) {
    return NextResponse.json({ error: "invalid_code" }, { status: 401 })
  }

  return NextResponse.json(exchangePayload, {
    headers: {
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  })
}
