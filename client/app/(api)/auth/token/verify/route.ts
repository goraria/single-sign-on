import { NextRequest, NextResponse } from "next/server"

import {
  getNoStoreHeaders,
  getStringProperty,
  readJsonObject,
} from "@/lib/utils/formatter"
import { verifyRouteToken } from "@/services/route"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const body = (await readJsonObject(request)) ?? {}
  const response = await verifyRouteToken({
    access_token: getStringProperty(body, "access_token"),
    refresh_token: getStringProperty(body, "refresh_token"),
    app: body.app && typeof body.app === "object" ? body.app : undefined,
  })

  if (response.status < 200 || response.status >= 300) {
    return NextResponse.json(
      { error: response.status === 401 ? "invalid_token" : "verify_failed" },
      {
        status: response.status,
        headers: getNoStoreHeaders(),
      }
    )
  }

  return NextResponse.json(response.data, {
    headers: getNoStoreHeaders(),
  })
}
