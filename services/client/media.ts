"use client"

/* eslint-disable react-hooks/rules-of-hooks -- This module builds a caller service definition; it does not execute a React hook during module evaluation. */

import { caller, createMutationService, useMutation } from "@/utils/caller"
import { avatarUploadTicketSchema } from "@/schemas/media"

const allowedImageTypes = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
])

const maxImageSize = 2_048 * 1_024

export interface UploadedProfileImage {
  assetId: string
  path: string
  url: string
}

function validateProfileImage(file: File) {
  if (!allowedImageTypes.has(file.type)) {
    throw new Error("Only JPG, JPEG, PNG, GIF, and WebP images are allowed.")
  }

  if (file.size > maxImageSize) {
    throw new Error("The image must be no larger than 2048 KB.")
  }
}

const uploadProfileImageService = useMutation<UploadedProfileImage, File>({
  query: (file) => {
    validateProfileImage(file)

    const body = new FormData()
    body.set("file", file)

    return {
      url: "/storage/avatar",
      method: "POST",
      baseURL: null,
      body,
      credentials: "include",
      responseHandler: async (response) => {
        const ticket = avatarUploadTicketSchema.parse(response.data)
        try {
          // Signed storage URLs are the sole intentional cross-origin browser call.
          // Never attach cookies or the application's OAuth Authorization header.
          const result = await fetch(ticket.uploadUrl, {
            method: "PUT",
            body: file,
            credentials: "omit",
            redirect: "error",
            headers: { "Content-Type": file.type },
            signal: AbortSignal.timeout(30_000),
          })
          if (!result.ok) throw new Error("Image upload failed.")
          return await caller<UploadedProfileImage>({
            url: `/storage/avatar/upload/${ticket.uploadId}`,
            method: "POST",
            body: {},
            baseURL: null,
            credentials: "include",
            toast: false,
          })
        } catch {
          try {
            await caller({
              url: `/storage/avatar/upload/${ticket.uploadId}`,
              method: "DELETE",
              baseURL: null,
              credentials: "include",
              toast: false,
            })
          } catch {
            /* Cleanup errors never replace the upload error. */
          }
          throw new Error("Image upload failed. Please try again.")
        }
      },
    }
  },
})

export const useUploadProfileImageMutation = createMutationService(
  uploadProfileImageService
)
