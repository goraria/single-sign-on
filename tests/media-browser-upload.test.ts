import { beforeEach, expect, it, vi } from "vitest"
const state = vi.hoisted(() => ({ caller: vi.fn(), fetch: vi.fn() }))
const ticket = {
  assetId: "4a70aa04-21f9-4c16-b573-2b1bb800bfbd",
  uploadId: "1b703304-21f9-4c16-b573-2b1bb800bfbd",
  uploadUrl: "https://neon.example/file?signature=capability",
  contentType: "image/png",
}
vi.mock("@/utils/caller", () => ({
  caller: state.caller,
  useMutation: (definition: unknown) => definition,
  createMutationService:
    (definition: {
      query: (file: File) => {
        url: string
        body: FormData
        responseHandler: (response: { data: unknown }) => Promise<unknown>
      }
    }) =>
    async (file: File) => {
      const request = definition.query(file)
      expect(request.url).toBe("/storage/avatar")
      expect(request.body.get("file")).toBe(file)
      return request.responseHandler({ data: ticket })
    },
}))
import { useUploadProfileImageMutation } from "@/services/client/media"
const run = useUploadProfileImageMutation as unknown as (
  file: File
) => Promise<unknown>
const file = () => new File(["image"], "avatar.png", { type: "image/png" })
beforeEach(() => {
  state.fetch.mockReset().mockResolvedValue(new Response(null, { status: 200 }))
  state.caller
    .mockReset()
    .mockResolvedValue({ url: "https://sso.example/storage/avatar/asset" })
  vi.stubGlobal("fetch", state.fetch)
})
it("PUTs from the browser with no cookies/bearer, then completes via same-origin caller", async () => {
  const image = file()
  await run(image)
  expect(state.fetch).toHaveBeenCalledWith(
    ticket.uploadUrl,
    expect.objectContaining({
      method: "PUT",
      body: image,
      credentials: "omit",
      redirect: "error",
      headers: { "Content-Type": "image/png" },
    })
  )
  expect(state.caller).toHaveBeenCalledWith(
    expect.objectContaining({
      url: `/storage/avatar/upload/${ticket.uploadId}`,
      method: "POST",
      baseURL: null,
    })
  )
})
it("aborts an unsuccessful PUT without forwarding signed URL errors to the UI", async () => {
  state.fetch.mockRejectedValueOnce(new Error("private-signed-url"))
  await expect(run(file())).rejects.toThrow(
    "Image upload failed. Please try again."
  )
  expect(state.caller).toHaveBeenCalledWith(
    expect.objectContaining({ method: "DELETE" })
  )
  expect(state.caller).not.toHaveBeenCalledWith(
    expect.objectContaining({ method: "POST" })
  )
})
