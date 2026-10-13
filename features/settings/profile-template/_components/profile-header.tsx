import Link from "next/link"
import {
  BadgeCheck,
  Ellipsis,
  Eye,
  Mail,
  Pencil,
  UserRoundX,
} from "@gorth/primitive/cores/lucide"

import { NavProfile } from "@gorth/primitive/dashboard/nav-user"
import { Badge } from "@gorth/primitive/custom/badge"
import { Button } from "@gorth/primitive/custom/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@gorth/primitive/custom/dropdown"

import type { ProfileRecord } from "./profile-data"

interface ProfileHeaderProps {
  profile: ProfileRecord
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col items-start gap-6 px-4 text-left lg:flex-row lg:items-end lg:justify-between">
      <div className="flex min-w-0 flex-col items-start gap-6 md:flex-row md:items-end">
        <NavProfile user={{ name: profile.name, avatar: profile.avatar, email: profile.workEmail }} className="shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{profile.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{profile.workEmail}</span>
            <span aria-hidden="true">•</span>
            <span>{profile.jobTitle}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              className="rounded-sm border-amber-600/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              variant="secondary"
            >
              92% Complete
            </Badge>
            {profile.emailVerified ? (
              <Badge
                className="rounded-sm bg-green-600 text-white"
                variant="default"
              >
                <BadgeCheck data-icon="inline-start" />
                Verified
              </Badge>
            ) : (
              <Badge variant="outline">Unverified</Badge>
            )}
            <Badge className="rounded-sm" variant="outline">
              {profile.employmentType}
            </Badge>
            <Badge className="rounded-sm" variant="outline">
              {profile.workplace}
            </Badge>
            <Badge className="rounded-sm" variant="outline">
              {profile.timeZone}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 lg:ml-auto">
        <Button
          nativeButton={false}
          render={<a href={`mailto:${profile.workEmail}`} />}
          variant="outline"
        >
          <Mail data-icon="inline-start" />
          Email
        </Button>
        <Button
          nativeButton={false}
          render={<Link href="/settings/profile" />}
        >
          <Pencil data-icon="inline-start" />
          Edit profile
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label="More profile actions"
                size="icon"
                variant="outline"
              />
            }
          >
            <Ellipsis />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Eye />
                View as employee
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive">
                <UserRoundX />
                Deactivate profile
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
