"use client";

import { useMemo, useState } from "react";
import { Badge } from "@gorth/primitive/default/badge";
import { Button } from "@gorth/primitive/default/button";
import { Input } from "@gorth/primitive/default/input";
import { Plus, Upload } from "@gorth/primitive/cores/lucide";

const tasks = [
  ["TASK-8782", "Review OAuth client redirect URIs", "In Progress", "High"],
  ["TASK-7878", "Audit refresh-token rotation", "Backlog", "Medium"],
  ["TASK-7839", "Document SSO deployment variables", "Todo", "High"],
  ["TASK-5562", "Verify post-logout redirects", "Done", "Low"],
  ["TASK-8686", "Review application consent screen", "Canceled", "Medium"],
  ["TASK-1280", "Rotate staging client credentials", "In Progress", "High"],
  ["TASK-7262", "Add authentication metrics", "Todo", "Medium"],
] as const;

export function TasksView() {
  const [query, setQuery] = useState("");
  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) =>
        task.join(" ").toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Here&apos;s a list of your tasks for this month.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="size-4" />
            Import
          </Button>
          <Button>
            <Plus className="size-4" />
            New task
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter tasks..."
          className="w-full sm:w-72"
        />
        <Button variant="outline">Status</Button>
        <Button variant="outline">Priority</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <div className="min-w-180">
          <div className="bg-muted/50 grid grid-cols-[100px_minmax(240px,1fr)_130px_100px] gap-3 border-b px-4 py-3 text-xs font-medium">
            <span>Task</span>
            <span>Title</span>
            <span>Status</span>
            <span>Priority</span>
          </div>
          {filteredTasks.map(([id, title, status, priority]) => (
            <div
              key={id}
              className="grid grid-cols-[100px_minmax(240px,1fr)_130px_100px] items-center gap-3 border-b px-4 py-3 text-sm last:border-b-0"
            >
              <span className="font-mono text-xs">{id}</span>
              <span className="font-medium">{title}</span>
              <Badge variant="outline" className="w-fit">
                {status}
              </Badge>
              <span className="text-muted-foreground">{priority}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
