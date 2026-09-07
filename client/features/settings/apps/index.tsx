"use client"

import { useMemo, useState } from "react"
import {
  ArrowDownAZ,
  ArrowUpAZ,
  SlidersHorizontal,
  Share2,
  Waypoints,
} from "@gorth/primitive/cores/lucide"
import { Button } from "@gorth/primitive/custom/button"
import { Input } from "@gorth/primitive/default/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gorth/primitive/default/select"
import { Card, CardContent, CardHeader } from "@gorth/primitive/default/card"
import { compareText, matchesSearchQuery } from "@/lib/utils/formatter"
import { appConnection } from "@/lib/utils/constant"

type AppFilter = "all" | "connected" | "notConnected"

export function Apps() {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<AppFilter>("all")
  const [sort, setSort] = useState<"asc" | "desc">("asc")
  const filteredApps = useMemo(
    () =>
      [...appConnection]
        .filter(({ isActive }) =>
          filter === "connected"
            ? isActive
            : filter === "notConnected"
              ? !isActive
              : true
        )
        .filter(({ title }) => matchesSearchQuery(title, query))
        .sort((a, b) => compareText(a.title, b.title, sort)),
    [filter, query, sort]
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">App Integrations</h1>
          {/* <p className="text-muted-foreground">
            Here&apos;s a list of your apps for the integration!
          </p> */}
        </div>
        <div className="flex gap-2 ms-auto items-end justify-between sm:items-center">
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
      </div>
      <ul className="grid min-h-0 flex-1 gap-6 ring-0 md:grid-cols-3">
        {filteredApps.map(({ title, icon: Icon, isActive, description }) => (
          <Card key={title} className="gap-4 py-4 hover:shadow-md">
            <CardHeader className="flex items-start justify-between px-4">
              <div className="bg-muted flex size-12 items-center justify-center rounded-lg p-2">
                <Icon className="size-5" />
              </div>
              <Button variant={isActive ? "default" : "outline"}>
                {isActive ? <Waypoints /> : <Share2 />}
                {isActive ? "Connected" : "Connect"}
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 px-4">
              <h2 className="font-semibold">{title}</h2>
              <p className="text-muted-foreground line-clamp-1 truncate">
                {description}
              </p>
            </CardContent>
          </Card>
        ))}
      </ul>
    </div>
  )
}
