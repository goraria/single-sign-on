"use server"

import { headers } from "next/headers"
import { getRouteSession } from "@/services/route"

export async function getSession() {
  return getRouteSession((await headers()).get("cookie") ?? "")
}
