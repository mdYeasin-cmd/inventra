"use client"

import {
  ArrowRight,
  Boxes,
  ClipboardList,
  LogOut,
  ShieldCheck,
  Truck,
} from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { clearAuthTokens, getStoredSession } from "@/services/auth-storage"

const highlights = [
  {
    title: "Inventory coverage",
    value: "94%",
    detail: "Core catalog stays in stock and visible across your operation.",
    icon: Boxes,
  },
  {
    title: "Orders moving",
    value: "128",
    detail:
      "Open orders are moving through fulfillment with clearer status checks.",
    icon: ClipboardList,
  },
  {
    title: "Restock alerts",
    value: "07",
    detail:
      "Prioritized restock signals keep low-stock items from being missed.",
    icon: Truck,
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const [session, setSession] = React.useState<ReturnType<
    typeof getStoredSession
  > | null>(null)
  const [isCheckingSession, setIsCheckingSession] = React.useState(true)

  React.useEffect(() => {
    const storedSession = getStoredSession()

    if (!storedSession) {
      router.replace("/login")
      return
    }

    setSession(storedSession)
    setIsCheckingSession(false)
  }, [router])

  function handleLogout() {
    clearAuthTokens()
    router.push("/login")
  }

  if (isCheckingSession) {
    return (
      <main className="flex min-h-svh items-center justify-center px-6 py-16 text-center">
        <div className="space-y-3">
          <p className="text-sm tracking-[0.25em] text-muted-foreground uppercase">
            Checking session
          </p>
          <h1 className="text-2xl font-semibold">
            Preparing your dashboard...
          </h1>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-svh overflow-hidden px-6 py-16">
      <div className="absolute inset-0 -z-10 bg-background" />
      <div className="absolute top-0 right-0 -z-10 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 -z-10 h-80 w-80 rounded-full bg-muted blur-3xl" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <div className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-background/85 p-6 shadow-xl backdrop-blur sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-1.5 text-sm text-muted-foreground">
                <ShieldCheck className="size-4" />
                Authenticated workspace
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
                  Welcome to your Inventra dashboard.
                </h1>
                <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                  Your login flow is active. From here you can monitor
                  inventory, review active orders, and keep your restock
                  priorities visible.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              className="h-11 rounded-full px-5"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              Logout
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-5">
              <p className="text-sm text-muted-foreground">Signed in role</p>
              <p className="mt-3 text-2xl font-semibold">
                {session?.role ?? "Admin"}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-5">
              <p className="text-sm text-muted-foreground">Session state</p>
              <p className="mt-3 text-2xl font-semibold">Active</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-5">
              <p className="text-sm text-muted-foreground">Token expiry</p>
              <p className="mt-3 text-2xl font-semibold">
                {session?.exp
                  ? new Date(session.exp * 1000).toLocaleTimeString()
                  : "Available"}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-5">
              <p className="text-sm text-muted-foreground">User reference</p>
              <p className="mt-3 truncate text-2xl font-semibold">
                {session?.userId ? session.userId.slice(-6) : "Stored"}
              </p>
            </div>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-3">
          {highlights.map((item) => {
            const Icon = item.icon

            return (
              <article
                key={item.title}
                className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm backdrop-blur"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {item.title}
                    </p>
                    <p className="mt-3 text-4xl font-semibold tracking-tight">
                      {item.value}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Icon className="size-5" />
                  </div>
                </div>
                <p className="mt-6 text-sm leading-6 text-muted-foreground">
                  {item.detail}
                </p>
              </article>
            )
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm backdrop-blur">
            <p className="text-sm tracking-[0.25em] text-muted-foreground uppercase">
              Next steps
            </p>
            <h2 className="mt-3 text-2xl font-semibold">
              Where to take the workspace next
            </h2>
            <div className="mt-6 grid gap-3">
              <div className="flex items-center justify-between rounded-2xl border border-border/60 px-4 py-4">
                <div>
                  <p className="font-medium">Connect your product catalog</p>
                  <p className="text-sm text-muted-foreground">
                    Start bringing inventory records into one system of truth.
                  </p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/60 px-4 py-4">
                <div>
                  <p className="font-medium">Review pending orders</p>
                  <p className="text-sm text-muted-foreground">
                    Keep fulfillment queues visible and actionable.
                  </p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/60 px-4 py-4">
                <div>
                  <p className="font-medium">Track low-stock items</p>
                  <p className="text-sm text-muted-foreground">
                    Spot risk earlier and move fast on replenishment decisions.
                  </p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm backdrop-blur">
            <p className="text-sm tracking-[0.25em] text-muted-foreground uppercase">
              Session note
            </p>
            <h2 className="mt-3 text-2xl font-semibold">
              Auth is now connected end to end
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Signup sends account data to your backend, login stores returned
              tokens through the centralized services layer, and this dashboard
              checks the stored session before rendering.
            </p>
          </aside>
        </section>
      </div>
    </main>
  )
}
