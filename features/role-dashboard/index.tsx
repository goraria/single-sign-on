import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gorth/primitive/default/card"
import { Badge } from "@gorth/primitive/custom/badge"
import { Button } from "@gorth/primitive/custom/button"
import type { DashboardRole } from "@/utils/dashboard"

export function RoleDashboard({
  role,
}: {
  role: Exclude<DashboardRole, "admin">
}) {
  const vice = role === "vice"
  const cards = vice
    ? [
        {
          title: "Review queue",
          value: "12",
          description: "Pending workspace reviews",
        },
        {
          title: "Team activity",
          value: "28",
          description: "Recent team updates",
        },
        {
          title: "Assigned tasks",
          value: "8",
          description: "Demo assignments",
        },
      ]
    : [
        {
          title: "Your activity",
          value: "24",
          description: "Recent workspace events",
        },
        {
          title: "Connected apps",
          value: "6",
          description: "Demo application connections",
        },
        {
          title: "Notifications",
          value: "3",
          description: "Unread demo notifications",
        },
      ]

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {vice ? "Vice" : "User"} dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            {vice
              ? "Review and coordinate your workspace."
              : "Your personal workspace overview."}
          </p>
        </div>
        <Badge variant="outline">Demo</Badge>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader>
              <CardDescription>{card.title}</CardDescription>
              <CardTitle className="text-3xl">{card.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Workspace settings</CardTitle>
          <CardDescription>
            This dashboard uses demo data. Manage your real account in Settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button nativeButton={false} render={<Link href="/settings" />}>
            Open settings
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}
