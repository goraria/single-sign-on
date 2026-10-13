"use client"

import { Orbit } from "@gorth/primitive/illustration/orbit"
import { authOrbitData } from "@/utils/constant"

export function AuthIllustration() {
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <Orbit
        data={authOrbitData}
        trigger="orbit"
        background={["ripple", "particles"]}
        orbitData={[
          {
            dashed: true,
            ringSize: 240,
            avatarSize: 36,
            duration: 20,
            avatars: authOrbitData.navMain,
          },
          {
            dashed: true,
            ringSize: 400,
            avatarSize: 36,
            duration: 30,
            reverse: true,
            avatars: authOrbitData.navSecondary,
          },
          {
            dashed: true,
            ringSize: 560,
            avatarSize: 36,
            duration: 40,
            avatars: authOrbitData.navSignal,
          },
        ]}
      />
      <div className="max-w-sm space-y-2 px-4">
        <h2 className="text-2xl font-semibold">
          One identity. Every connection.
        </h2>
        <p className="text-sm text-muted-foreground">
          Secure access to your account and the entire Gorth ecosystem.
        </p>
      </div>
    </div>
  )
}
