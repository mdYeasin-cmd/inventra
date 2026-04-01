"use client"

import {
  Boxes,
  ClipboardList,
  Layers,
  LayoutDashboard,
  RefreshCw,
  X,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DashboardSession } from "@/components/dashboard-shell"

type NavigationItem = {
  title: string
  href: string
  icon: typeof LayoutDashboard
}

const mainNavigation: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Categories",
    icon: Layers,
    href: "/dashboard/categories",
  },
  {
    title: "Products",
    icon: Boxes,
    href: "/dashboard/products",
  },
  {
    title: "Orders",
    icon: ClipboardList,
    href: "/dashboard/orders",
  },
  {
    title: "Restock Queue",
    icon: RefreshCw,
    href: "/dashboard/restock-queue",
  },
] as const

type AppSidebarProps = {
  session: DashboardSession
  isOpen: boolean
  onClose: () => void
}

function AppSidebar({ session, isOpen, onClose }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-out md:static md:z-auto md:translate-x-0",
        isOpen && "translate-x-0"
      )}
      aria-label="Dashboard navigation"
    >
      <div className="flex items-center justify-between border-b border-sidebar-border px-5 py-4">
        <div>
          <p className="text-xs font-medium tracking-[0.24em] text-sidebar-foreground/60 uppercase">
            Inventra
          </p>
          <p className="mt-1 text-lg font-semibold">Operations Hub</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X className="size-4" />
        </Button>
      </div>

      <nav className="flex-1 space-y-8 overflow-y-auto px-4 py-5">
        <section className="space-y-3">
          <div className="space-y-1.5">
            {mainNavigation.map((item) => {
              const Icon = item.icon
              const isActive = item.href ? pathname === item.href : false

              // if (item.isAvailable && item.href) {
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  onClick={onClose}
                  aria-current={isActive ? "page" : undefined}
                >
                  <div className="rounded-xl bg-sidebar-foreground/8 p-2">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{item.title}</p>
                    {/* <p className="truncate text-xs text-sidebar-foreground/60">
                      {item.description}
                    </p> */}
                  </div>
                </Link>
              )
              // }

              // return (
              //   <button
              //     key={item.title}
              //     type="button"
              //     disabled
              //     className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sidebar-foreground/45"
              //   >
              //     <div className="rounded-xl bg-sidebar-foreground/8 p-2">
              //       <Icon className="size-4" />
              //     </div>
              //     <div className="min-w-0 flex-1">
              //       <div className="flex items-center justify-between gap-3">
              //         <p className="font-medium">{item.title}</p>
              //         <span className="rounded-full border border-sidebar-border px-2 py-0.5 text-[0.65rem] font-medium tracking-[0.2em] uppercase">
              //           Soon
              //         </span>
              //       </div>
              //       <p className="truncate text-xs text-sidebar-foreground/50">
              //         {item.description}
              //       </p>
              //     </div>
              //   </button>
              // )
            })}
          </div>
        </section>
      </nav>
    </aside>
  )
}

export { AppSidebar }
