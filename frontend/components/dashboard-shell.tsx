"use client"

import { LogOut, Menu } from "lucide-react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  clearAuthTokens,
  getSessionSnapshot,
  subscribeToSessionStore,
} from "@/services/auth-storage"
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react"

export type DashboardSession = NonNullable<
  ReturnType<typeof getSessionSnapshot>
>

const DashboardSessionContext = createContext<DashboardSession | null>(null)

function getServerSessionSnapshot() {
  return null
}

function useDashboardSession() {
  const session = useContext(DashboardSessionContext)

  if (!session) {
    throw new Error("useDashboardSession must be used within DashboardShell")
  }

  return session
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const session = useSyncExternalStore(
    subscribeToSessionStore,
    getSessionSnapshot,
    getServerSessionSnapshot
  )

  useEffect(() => {
    if (!session) {
      router.replace("/login")
    }
  }, [router, session])

  function handleLogout() {
    clearAuthTokens()
    router.push("/login")
  }

  if (!session) {
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
    <DashboardSessionContext.Provider value={session}>
      <div className="min-h-svh bg-background md:flex">
        {isSidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/45 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar overlay"
          />
        ) : null}

        <AppSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="flex min-h-svh min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="md:hidden"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu className="size-4" />
              </Button>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Dashboard</p>
                <p className="hidden truncate text-xs text-muted-foreground sm:block">
                  Manage inventory, orders, and restock priorities from one
                  workspace.
                </p>
              </div>

              <ThemeToggle
                showLabel={false}
                className="size-10 rounded-full px-0"
              />

              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-full px-4"
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </DashboardSessionContext.Provider>
  )
}

export { DashboardShell, useDashboardSession }
