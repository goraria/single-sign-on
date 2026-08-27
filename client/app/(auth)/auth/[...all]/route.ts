import { handleAuthProxy } from "@/lib/auth/proxy"

export const runtime = "nodejs"

export const GET = handleAuthProxy
export const POST = handleAuthProxy
export const PUT = handleAuthProxy
export const PATCH = handleAuthProxy
export const DELETE = handleAuthProxy
