import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"
import { beforeEach, describe, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({ write: vi.fn(), called: vi.fn() }))
vi.mock("@/services/audit", () => ({
  recordAdminAudit: state.write,
  newAuditRequestId: () => "audit-request",
}))
import { auditAdminMutation } from "@/middlewares/admin-audit"

const id = "c50d1ac3-bc90-4b7d-8efa-c81b67f0c3ed"
function router(fail = false) {
  return new Hono<{
    Variables: { adminActor: { id: string; name: string; email: string } }
  }>()
    .post(
      "/user",
      async (ctx, next) => {
        ctx.set("adminActor", { id, name: "Admin", email: "admin@example.com" })
        await next()
      },
      auditAdminMutation("user"),
      (ctx) => {
        state.called()
        if (fail) throw new HTTPException(400, { message: "invalid_request" })
        return ctx.json({ data: { id } }, 201)
      }
    )
    .onError((error, ctx) =>
      error instanceof HTTPException
        ? error.getResponse()
        : ctx.json({ error: "unavailable" }, 503)
    )
}
beforeEach(() => {
  state.write.mockReset().mockResolvedValue(undefined)
  state.called.mockReset()
})
describe("durable admin audit", () => {
  it("records intent and actual success with the created target and correlation ID", async () => {
    const response = await router().request("/user", {
      method: "POST",
      headers: { cookie: "private-cookie" },
      body: JSON.stringify({ password: "private-password" }),
    })
    expect(response.status).toBe(201)
    expect(state.write).toHaveBeenCalledTimes(2)
    expect(state.write.mock.calls[1]).toEqual([
      expect.objectContaining({
        resourceId: id,
        action: "user.post",
        requestId: "audit-request",
      }),
      "success",
      "completed",
      201,
    ])
    expect(JSON.stringify(state.write.mock.calls)).not.toContain("private")
    expect(response.headers.get("cache-control")).toBe("no-store")
  })
  it("records controller/validation failures instead of claiming success", async () => {
    expect(
      (await router(true).request("/user", { method: "POST" })).status
    ).toBe(400)
    expect(state.write.mock.calls[1][1]).toBe("failure")
    expect(state.write.mock.calls[1][3]).toBe(400)
  })
  it("fails closed before mutations when the intent cannot be persisted", async () => {
    state.write.mockRejectedValue(new HTTPException(503))
    expect((await router().request("/user", { method: "POST" })).status).toBe(
      503
    )
    expect(state.called).not.toHaveBeenCalled()
  })
  it("does not claim rollback when completion logging fails", async () => {
    state.write
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("unavailable"))
    const response = await router().request("/user", { method: "POST" })
    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({
      operationMayHaveCompleted: true,
    })
    expect(state.called).toHaveBeenCalledOnce()
  })
})
