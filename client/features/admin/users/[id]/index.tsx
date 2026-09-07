"use client"

import Link from "next/link"
import { ArrowLeft } from "@gorth/primitive/cores/lucide"
import { Avatar, AvatarFallback, AvatarImage } from "@gorth/primitive/custom/avatar"
import { Button } from "@gorth/primitive/custom/button"
import { Card, CardContent, CardHeader, CardTitle } from "@gorth/primitive/default/card"
import { formatDateTime, getInitials } from "@/lib/utils/formatter"
import { renderUserRole, renderUserStatus } from "@/lib/utils/renderer"
import { useUserQuery } from "@/services/admin"

export function UserDetails({ id }: { id: string }) {
  const query = useUserQuery(id)
  const user = query.data

  if (query.isLoading) return <p className="text-muted-foreground">Loading user...</p>
  if (query.error || !user) {
    return <p className="text-destructive">{query.error?.message ?? "User not found."}</p>
  }

  const details = [
    ["User ID", user.id],
    ["Username", user.username ?? "Unknown"],
    ["First name", user.firstName ?? "Unknown"],
    ["Last name", user.lastName ?? "Unknown"],
    ["Created", formatDateTime(user.createdAt)],
    ["Updated", formatDateTime(user.updatedAt)],
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button nativeButton={false} render={<Link href="/admin/users" />} variant="outline" size="icon">
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User details</h1>
          <p className="text-muted-foreground">Review identity and account status.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-4">
          <Avatar size="lg">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback>{getInitials(user.name || user.email)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <CardTitle>{user.name}</CardTitle>
            <p className="text-muted-foreground truncate text-sm">{user.email}</p>
          </div>
          <div className="flex items-center gap-4">
            {renderUserRole(user.role)}
            {renderUserStatus(user)}
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {details.map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-muted-foreground text-xs font-medium uppercase">{label}</dt>
                <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
