"use client";

import { useMemo, useState } from "react";
import { Button } from "@gorth/primitive/default/button";
import { Input } from "@gorth/primitive/default/input";
import { Separator } from "@gorth/primitive/default/separator";
import {
  Bot,
  Boxes,
  Cloud,
  Database,
  GitFork,
  Mail,
  MessageSquare,
  Video,
} from "@gorth/primitive/cores/lucide";

type AppFilter = "all" | "connected" | "not-connected";

const apps = [
  {
    name: "GitHub",
    description: "Connect repositories, issues, and deployment workflows.",
    connected: true,
    icon: GitFork,
  },
  {
    name: "Slack",
    description: "Receive workspace notifications and security alerts.",
    connected: true,
    icon: MessageSquare,
  },
  {
    name: "Google Mail",
    description: "Send transactional e-mails from your applications.",
    connected: false,
    icon: Mail,
  },
  {
    name: "Supabase",
    description: "Synchronize users and application data securely.",
    connected: true,
    icon: Database,
  },
  {
    name: "Vercel",
    description: "Manage production and preview deployments.",
    connected: false,
    icon: Cloud,
  },
  {
    name: "OpenAI",
    description: "Add intelligent assistants and automation workflows.",
    connected: false,
    icon: Bot,
  },
  {
    name: "Video Platform",
    description: "Connect Gorth video streaming services.",
    connected: true,
    icon: Video,
  },
  {
    name: "Gorth Apps",
    description: "Manage internal ecosystem application integrations.",
    connected: true,
    icon: Boxes,
  },
];

export function AppsView() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AppFilter>("all");
  const [sort, setSort] = useState<"asc" | "desc">("asc");

  const filteredApps = useMemo(
    () =>
      [...apps]
        .filter((app) =>
          filter === "connected"
            ? app.connected
            : filter === "not-connected"
              ? !app.connected
              : true,
        )
        .filter((app) => app.name.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) =>
          sort === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name),
        ),
    [filter, query, sort],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">App Integrations</h1>
        <p className="text-muted-foreground">
          Here&apos;s a list of your apps for the integration.
        </p>
      </div>
      <div className="my-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap gap-3">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter apps..."
            className="w-full sm:w-64"
          />
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as AppFilter)}
            className="border-input bg-background h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
          >
            <option value="all">All Apps</option>
            <option value="connected">Connected</option>
            <option value="not-connected">Not Connected</option>
          </select>
        </div>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as "asc" | "desc")}
          aria-label="Sort applications"
          className="border-input bg-background h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
      <Separator />
      <ul className="grid gap-4 overflow-auto pt-4 pb-16 md:grid-cols-2 xl:grid-cols-3">
        {filteredApps.map((app) => {
          const Icon = app.icon;
          return (
            <li
              key={app.name}
              className="rounded-lg border p-4 transition-shadow hover:shadow-md"
            >
              <div className="mb-8 flex items-center justify-between">
                <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
                  <Icon className="size-5" />
                </div>
                <Button
                  variant="outline"
                  className={
                    app.connected
                      ? "border-primary/30 bg-primary/5 text-primary"
                      : undefined
                  }
                >
                  {app.connected ? "Connected" : "Connect"}
                </Button>
              </div>
              <h2 className="mb-1 font-semibold">{app.name}</h2>
              <p className="text-muted-foreground line-clamp-2 text-sm">
                {app.description}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
