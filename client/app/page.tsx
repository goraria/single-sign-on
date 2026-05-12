"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "gorth-ui/default/button"
import { Badge } from "gorth-ui/default/badge"
import { cn } from "gorth-ui/lib/utils"
import { Input } from "gorth-ui/default/input"
import { toast } from "gorth-ui/cores/sonner"
import { health, param, query } from "@/services/api"

export default function Page() {
  const router = useRouter()

  const {
    data: healthData = [],
    error: healthError,
    refetch: refetchHealth,
    isLoading: isHealthLoading,
    isFetching: isHealthFetching,
    isUninitialized: isHealthUninitialized,
    isSuccess: isHealthSuccess,
    isError: isHealthError,
  } = health()

  const [paramId, setParamId] = useState("123")
  const [queryText, setQueryText] = useState("abc")

  const {
    data: paramData = null,
    error: paramError,
    refetch: refetchParam,
    isLoading: isParamLoading,
    isFetching: isParamFetching,
  } = param({ id: paramId })

  const {
    data: queryData = null,
    error: queryError,
    refetch: refetchQuery,
    isLoading: isQueryLoading,
    isFetching: isQueryFetching,
  } = query({ q: queryText })

  const fetchParam = async () => {
    await refetchParam()
    toast.success(`param = ${paramId}`)
  }

  const fetchQuery = async () => {
    await refetchQuery()
    toast.success(`query = ${queryText}`)
  }

  return (
    <>
      <div className="flex min-h-svh p-6">
        <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
          <div>
            <h1 className="font-medium">Project ready!</h1>
            <p>You may now add components and start building.</p>
            <p>We&apos;ve already added the button component for you.</p>
            <Button variant="default" className="">Button X</Button>
            <Button variant="default" onClick={() => {
              console.log("JP")
            }}>
              Hello world Japtor
            </Button>
            <Button variant="default" onClick={() => router.push("/auth/sign-in")}>
              Sign in
            </Button>
            <Button variant="default" onClick={() => router.push("/auth/sign-up")}>
              Sign up
            </Button>

            <div className="mt-4 flex flex-col gap-2 rounded-md border p-3">
              <p className="font-medium">Health query (Redux Query style)</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="default"
                  onClick={() => void refetchHealth()}
                  disabled={isHealthFetching}
                >
                  fetch
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void refetchHealth()}
                  disabled={isHealthFetching || isHealthUninitialized}
                >
                  refetch
                </Button>
              </div>

              <div className="font-mono text-xs leading-6 text-muted-foreground">
                <div>isUninitialized: {String(isHealthUninitialized)}</div>
                <div>isLoading: {String(isHealthLoading)}</div>
                <div>isFetching: {String(isHealthFetching)}</div>
                <div>isSuccess: {String(isHealthSuccess)}</div>
                <div>isError: {String(isHealthError)}</div>
                <div>
                  data: {healthData ? JSON.stringify(healthData) : "null"}
                </div>
                <div>
                  error: {healthError ? JSON.stringify(healthError) : "null"}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 rounded-md border p-3">
              <p className="font-medium">Param & Query demo</p>
              <div className="flex flex-col gap-2">
                <Input
                  value={paramId}
                  onChange={(event) => setParamId(event.target.value)}
                  placeholder="id"
                />
                <Button variant="default" onClick={fetchParam}>
                  /param/:id
                </Button>
                <div className="font-mono text-xs leading-6 text-muted-foreground">
                  <div>isLoading: {String(isParamLoading)}</div>
                  <div>isFetching: {String(isParamFetching)}</div>
                  <div>data: {paramData ? JSON.stringify(paramData) : "null"}</div>
                  <div>error: {paramError ? JSON.stringify(paramError) : "null"}</div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Input
                  value={queryText}
                  onChange={(event) => setQueryText(event.target.value)}
                  placeholder="q"
                />
                <Button variant="default" onClick={fetchQuery}>
                  /query?q=abc
                </Button>
                <div className="font-mono text-xs leading-6 text-muted-foreground">
                  <div>isLoading: {String(isQueryLoading)}</div>
                  <div>isFetching: {String(isQueryFetching)}</div>
                  <div>data: {queryData ? JSON.stringify(queryData) : "null"}</div>
                  <div>error: {queryError ? JSON.stringify(queryError) : "null"}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            (Press <kbd>d</kbd> to toggle dark mode)
          </div>
        </div>
      </div>
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={100}
            height={20}
            priority
          />
          <Button variant="default" size="lg" onClick={() => {
            console.log("JP")
          }}>
            Hello world Japtor
          </Button>
          <Badge variant="default">
            Hello world Japtor
          </Badge>
          <div className={cn("w-9 h-9 bg-professional-main", "rounded-full")}></div>
          <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
            <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
              To get started, edit the page.tsx file.
            </h1>
            <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Looking for a starting point or more instructions? Head over to{" "}
              <a
                href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                className="font-medium text-zinc-950 dark:text-zinc-50"
              >
                Templates
              </a>{" "}
              or the{" "}
              <a
                href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                className="font-medium text-zinc-950 dark:text-zinc-50"
              >
                Learning
              </a>{" "}
              center.
            </p>
          </div>
          <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
            <a
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
              href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                className="dark:invert"
                src="/vercel.svg"
                alt="Vercel logomark"
                width={16}
                height={16}
              />
              Deploy Now
            </a>
            <a
              className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
              href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Documentation
            </a>
          </div>
        </main>
      </div>
    </>
  )
}
