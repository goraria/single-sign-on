import { NextResponse } from "next/server"
import { consumeAuthorizationCode } from "@/lib/auth/code"
import {
  getNoStoreHeaders,
  getStringProperty,
  readJsonObject,
} from "@/lib/utils/formatter"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const payload = await readJsonObject(request)
  if (!payload) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
  }

  const code = getStringProperty(payload, "code", true)

  if (!code) {
    return NextResponse.json({ error: "missing_code" }, { status: 400 })
  }

  const exchangePayload = consumeAuthorizationCode(code)

  if (!exchangePayload) {
    return NextResponse.json({ error: "invalid_code" }, { status: 401 })
  }

  return NextResponse.json(exchangePayload, {
    headers: getNoStoreHeaders(),
  })
}
