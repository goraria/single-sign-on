import { beforeEach, expect, it, vi } from "vitest"
const id = "4a70aa04-21f9-4c16-b573-2b1bb800bfbd"
const uploadId = "1b703304-21f9-4c16-b573-2b1bb800bfbd"
const state = vi.hoisted(() => ({
  fetcher: vi.fn(),
  getSession: vi.fn(),
  issue: vi.fn(),
  registration: vi.fn(),
}))
vi.mock("server-only", () => ({}))
vi.mock("@/database", () => ({ database: {} }))
vi.mock("@/utils/environment", () => ({
  isProduction: true,
  appUrl: "https://sso.example",
  mediaAvatarBucketId: "avatar-bucket",
  awsEndpointUrlS3: "https://neon.example",
}))
vi.mock("@/utils/fetcher", () => ({ fetcher: state.fetcher }))
vi.mock("@/services/media-registration", () => ({
  getSsoMediaRegistration: state.registration,
}))
vi.mock("@/lib/auth/server/index", () => ({
  auth: {
    api: { issueMediaAccessToken: state.issue, getSession: state.getSession },
  },
}))
import { uploadAvatar, finishAvatarUpload } from "@/services/media"
import { POST } from "@/app/(api)/storage/avatar/route"
import { GET } from "@/app/(api)/storage/avatar/[id]/route"
const file = () =>
  new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], "avatar.png", {
    type: "image/png",
  })
beforeEach(() => {
  state.fetcher.mockReset()
  state.getSession.mockReset()
  state.issue.mockReset()
  state.registration.mockReset()
  state.registration.mockResolvedValue({ identifier: "https://media.example" })
  state.getSession.mockResolvedValue({ user: { id: "user-one" } })
  state.issue.mockResolvedValue({
    token: "server-only-token",
    resourceIdentifier: "https://media.example",
  })
  state.fetcher
    .mockResolvedValueOnce({
      data: {
        asset: { id, objectKey: "avatar/sso/object.png" },
        upload: {
          id: uploadId,
          method: "PUT",
          url: "https://neon.example/avatar/file?signature=private",
        },
      },
    })
    .mockResolvedValueOnce({ status: 200 })
    .mockResolvedValueOnce({ data: { id, status: "ready" } })
})
it("creates a browser PUT ticket without exposing an OAuth token or a storage key", async () => {
  const result = await uploadAvatar(
    file(),
    "user-one",
    new Headers({ cookie: "session=private" })
  )
  expect(result).toEqual({
    assetId: id,
    uploadId,
    contentType: "image/png",
    uploadUrl: "https://neon.example/avatar/file?signature=private",
  })
  const requests = state.fetcher.mock.calls.map(([request]) => request)
  expect(requests.map((request) => request.method)).toEqual(["POST"])
  expect(requests[0].body.resourceId).toBe("user-one")
  expect(requests[0].url.href).toBe("https://media.example/media/upload")
  expect(requests[0].headers).toEqual({
    Authorization: "Bearer server-only-token",
  })
  expect(JSON.stringify(result)).not.toContain("server-only-token")
})
it("uses the delegated registry destination for the entire upload, without an endpoint env", async () => {
  state.issue.mockResolvedValueOnce({
    token: "server-only-token",
    resourceIdentifier: "https://new-media.example",
  })
  await uploadAvatar(file(), "user-one", new Headers())
  const requests = state.fetcher.mock.calls.map(([request]) => request)
  expect(requests[0].url.origin).toBe("https://new-media.example")
  expect(state.registration).not.toHaveBeenCalled()
})
it("redacts transport errors when creating an upload", async () => {
  state.fetcher.mockReset()
  state.fetcher.mockRejectedValueOnce(new Error("Authorization=private secret"))
  await expect(uploadAvatar(file(), "user-one", new Headers())).rejects.toThrow(
    "avatar_upload_failed"
  )
  expect(state.fetcher.mock.calls).toHaveLength(1)
})
it("refuses a signed PUT pointing outside the configured Neon origin", async () => {
  state.fetcher.mockReset()
  state.fetcher
    .mockResolvedValueOnce({
      data: {
        asset: { id, objectKey: "key" },
        upload: {
          id: uploadId,
          method: "PUT",
          url: "https://attacker.example/file",
        },
      },
    })
    .mockResolvedValueOnce({ status: 204 })
  await expect(
    uploadAvatar(file(), "user-one", new Headers())
  ).rejects.toThrow()
  expect(state.fetcher.mock.calls.map(([request]) => request.method)).toEqual([
    "POST",
    "DELETE",
  ])
})
function request(origin = "https://sso.example", selectedFile = file()) {
  const body = new FormData()
  body.set("file", selectedFile)
  return new Request("https://sso.example/storage/avatar", {
    method: "POST",
    body,
    headers: { origin },
  })
}
it("protects the cookie-authenticated upload against CSRF", async () => {
  expect((await POST(request("https://attacker.example"))).status).toBe(403)
  expect(state.getSession).not.toHaveBeenCalled()
  expect(state.fetcher).not.toHaveBeenCalled()
})
it("rejects unauthenticated users and forged image MIME types", async () => {
  state.getSession.mockResolvedValueOnce(null)
  expect((await POST(request())).status).toBe(401)
  const forged = new File(["<script>private</script>"], "fake.png", {
    type: "image/png",
  })
  expect((await POST(request("https://sso.example", forged))).status).toBe(415)
  expect(state.fetcher).not.toHaveBeenCalled()
})
it("prepares a valid image through the same-origin route", async () => {
  const response = await POST(request())
  expect(response.status).toBe(200)
  expect(await response.json()).toMatchObject({
    assetId: id,
    uploadId,
  })
})

it("finishes only an owned avatar upload and returns a stable URL", async () => {
  state.fetcher.mockReset()
  state.fetcher
    .mockResolvedValueOnce({
      data: {
        asset: {
          id,
          objectKey: "avatar/key",
          bucketId: "avatar-bucket",
          resourceType: "avatar",
          resourceId: "user-one",
        },
      },
    })
    .mockResolvedValueOnce({ data: { id, status: "ready" } })
  expect(await finishAvatarUpload(uploadId, "user-one", new Headers())).toEqual(
    {
      assetId: id,
      path: "avatar/key",
      url: `https://sso.example/storage/avatar/${id}`,
    }
  )
  expect(state.fetcher.mock.calls.map(([request]) => request.method)).toEqual([
    "GET",
    "POST",
  ])
})
it("does not complete another user's upload or a non-avatar asset", async () => {
  for (const override of [
    { resourceId: "other" },
    { resourceType: "video" },
    { bucketId: "other-bucket" },
  ]) {
    state.fetcher.mockReset()
    state.fetcher.mockResolvedValueOnce({
      data: {
        asset: {
          id,
          objectKey: "key",
          bucketId: "avatar-bucket",
          resourceType: "avatar",
          resourceId: "user-one",
          ...override,
        },
      },
    })
    await expect(
      finishAvatarUpload(uploadId, "user-one", new Headers())
    ).rejects.toThrow()
    expect(state.fetcher.mock.calls).toHaveLength(1)
  }
})

it("bounds streamed multipart bodies even without a Content-Length header", async () => {
  // Controlled incoming bytes avoid Undici's outgoing FormData encoder race
  // when a receiver correctly cancels an oversized body mid-encoding.
  const oversized = new Request("https://sso.example/storage/avatar", {
    method: "POST",
    body: new Uint8Array(2_200_000),
    headers: {
      origin: "https://sso.example",
      "content-type": "multipart/form-data; boundary=test",
    },
  })
  expect((await POST(oversized)).status).toBe(413)
  expect(state.fetcher).not.toHaveBeenCalled()
})

it("returns a stable public delivery redirect, not an expiring URL or a secret", async () => {
  const response = await GET(
    new Request(`https://sso.example/storage/avatar/${id}`),
    { params: Promise.resolve({ id }) }
  )
  expect(response.status).toBe(307)
  expect(response.headers.get("location")).toBe(
    `https://media.example/media/public/${id}`
  )
  expect(response.headers.get("cache-control")).toBe("no-store")
  expect(
    (
      await GET(new Request("https://sso.example/storage/avatar/bad"), {
        params: Promise.resolve({ id: "bad" }),
      })
    ).status
  ).toBe(400)
})
it("refreshes public delivery from the registry and fails closed when registration is unavailable", async () => {
  state.registration.mockResolvedValueOnce({
    identifier: "https://new-media.example",
  })
  const request = new Request(`https://sso.example/storage/avatar/${id}`)
  const params = { params: Promise.resolve({ id }) }
  const response = await GET(request, params)
  expect(response.headers.get("location")).toBe(
    `https://new-media.example/media/public/${id}`
  )
  state.registration.mockRejectedValueOnce(
    new Error("private database credentials")
  )
  const unavailable = await GET(request, params)
  expect(unavailable.status).toBe(503)
  expect(await unavailable.json()).toEqual({ error: "media_not_configured" })
  expect(unavailable.headers.get("location")).toBeNull()
  expect(state.fetcher).not.toHaveBeenCalled()
})
