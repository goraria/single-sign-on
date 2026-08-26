"use client"

import { useMemo, useState } from "react"
import {
  ArrowDownAZ,
  ArrowUpAZ,
  BookOpen,
  Blocks,
  Container,
  CreditCard,
  Frame,
  GitBranch,
  Kanban,
  Mail,
  MessageCircle,
  MessagesSquare,
  Phone,
  Send,
  SlidersHorizontal,
  Video,
  Check,
  Share2,
  Waypoints,
} from "@gorth/primitive/cores/lucide"
import { Button } from "@gorth/primitive/custom/button"
import { Input } from "@gorth/primitive/default/input"
import { Separator } from "@gorth/primitive/default/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gorth/primitive/default/select"
import { Card } from "@gorth/primitive/default/card"

const apps = [
  [
    "Telegram",
    Send,
    false,
    "Connect with Telegram for real-time communication.",
  ],
  [
    "Notion",
    Blocks,
    true,
    "Effortlessly sync Notion pages for seamless collaboration.",
  ],
  ["Figma", Frame, true, "View and collaborate on Figma designs in one place."],
  [
    "Trello",
    Kanban,
    false,
    "Sync Trello cards for streamlined project management.",
  ],
  [
    "GitHub",
    GitBranch,
    false,
    "Streamline code management with GitHub integration.",
  ],
  [
    "Slack",
    MessageCircle,
    false,
    "Integrate Slack for efficient team communication.",
  ],
  ["Zoom", Video, true, "Host Zoom meetings directly from the dashboard."],
  [
    "Stripe",
    CreditCard,
    false,
    "Easily manage Stripe transactions and payments.",
  ],
  ["Gmail", Mail, true, "Access and manage Gmail messages effortlessly."],
  [
    "Medium",
    BookOpen,
    false,
    "Explore and share Medium stories on your dashboard.",
  ],
  ["Skype", Phone, false, "Connect with Skype contacts seamlessly."],
  [
    "Docker",
    Container,
    false,
    "Effortlessly manage Docker containers on your dashboard.",
  ],
  [
    "GitLab",
    GitBranch,
    false,
    "Efficiently manage code projects with GitLab integration.",
  ],
  [
    "Discord",
    MessagesSquare,
    false,
    "Connect with Discord for seamless team communication.",
  ],
  [
    "WhatsApp",
    MessageCircle,
    false,
    "Easily integrate WhatsApp for direct messaging.",
  ],
] as const

type AppFilter = "all" | "connected" | "notConnected"

export function Apps() {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<AppFilter>("all")
  const [sort, setSort] = useState<"asc" | "desc">("asc")
  const filteredApps = useMemo(
    () =>
      [...apps]
        .filter(([, , connected]) =>
          filter === "connected"
            ? connected
            : filter === "notConnected"
              ? !connected
              : true
        )
        .filter(([name]) => name.toLowerCase().includes(query.toLowerCase()))
        .sort(([a], [b]) =>
          sort === "asc" ? a.localeCompare(b) : b.localeCompare(a)
        ),
    [filter, query, sort]
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">App Integrations</h1>
        <p className="text-muted-foreground">
          Here&apos;s a list of your apps for the integration!
        </p>
      </div>
      <div className="my-4 flex items-end justify-between sm:my-0 sm:items-center">
        <div className="flex flex-col gap-4 sm:flex-row">
          <Input
            placeholder="Filter apps..."
            className="h-9 w-40 lg:w-62.5"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as AppFilter)}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Apps</SelectItem>
              <SelectItem value="connected">Connected</SelectItem>
              <SelectItem value="notConnected">Not Connected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Select
          value={sort}
          onValueChange={(value) => setSort(value as "asc" | "desc")}
        >
          <SelectTrigger className="w-16" aria-label="Sort applications">
            <SelectValue>
              <SlidersHorizontal className="size-4" />
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="asc">
              <span className="flex items-center gap-4">
                <ArrowUpAZ className="size-4" /> Ascending
              </span>
            </SelectItem>
            <SelectItem value="desc">
              <span className="flex items-center gap-4">
                <ArrowDownAZ className="size-4" /> Descending
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Separator className="shadow-sm" />
      <ul className="grid min-h-0 flex-1 gap-4 ring-0 pt-4 pb-16 md:grid-cols-3">
        {filteredApps.map(([name, Icon, connected, description]) => (
          <Card key={name} className="px-6 gap-2 hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-muted flex size-9 items-center justify-center rounded-lg p-2">
                <Icon className="size-4" />
              </div>
              <Button
                variant={connected ? "default" : "outline"}
              >
                {connected ? <Waypoints /> : <Share2 />}
                {connected ? "Connected" : "Connect"}
              </Button>
            </div>
            <h2 className="font-semibold">{name}</h2>
            <p className="truncate text-muted-foreground line-clamp-1">{description}</p>
          </Card>
        ))}
      </ul>
    </div>
  )
}
