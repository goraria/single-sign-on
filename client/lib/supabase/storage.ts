"use client"

/* eslint-disable react-hooks/rules-of-hooks -- This module builds a caller service definition; it does not execute a React hook during module evaluation. */

import { createMutationService, useMutation } from "@/lib/utils/caller"

const allowedImageTypes = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
])

const maxImageSize = 2_048 * 1_024

export interface UploadedProfileImage {
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
    }
  },
})

export const useUploadProfileImageMutation = createMutationService(
  uploadProfileImageService
)
