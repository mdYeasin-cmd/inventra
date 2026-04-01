"use client"

import {
  ArrowRight,
  Boxes,
  ClipboardList,
  History,
  LayoutDashboard,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"

import { ActivityLogList } from "@/components/activity-log-list"
import { DashboardFeedbackBanner } from "@/components/dashboard-feedback-banner"
import { DashboardPageHeader } from "@/components/dashboard-page-header"
import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { useDashboardSession } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { getErrorDetails } from "@/lib/api-error"
import { formatCurrency } from "@/lib/dashboard-format"
import { cn } from "@/lib/utils"
import {
  DashboardService,
  type DashboardOverview,
} from "@/services/dashboard.service"

type FeedbackState = {
  type: "success" | "error"
  message: string
}

function getInventoryStateClassName(state: DashboardOverview["productSummary"][number]["inventoryState"]) {
  if (state === "Out of Stock") {
    return "border-destructive/30 bg-destructive/10 text-destructive"
  }

  if (state === "Low Stock") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
  }

  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
}

export default function DashboardPage() {
  const session = useDashboardSession()
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const hasOverviewRef = useRef(false)

  useEffect(() => {
    hasOverviewRef.current = overview !== null
  }, [overview])

  const loadOverview = useCallback(async () => {
    setIsLoading((current) => current || !hasOverviewRef.current)
    setIsRefreshing((current) => current || hasOverviewRef.current)

    try {
      const result = await DashboardService.getDashboardOverview()
      setOverview(result.data)
      setFeedback(null)
    } catch (error) {
      const details = getErrorDetails(error, "Unable to load dashboard insights right now.")

      setFeedback({
        type: "error",
        message: details.message,
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  return (
    <div className="space-y-6 lg:space-y-8">
      <DashboardPageHeader
        icon={LayoutDashboard}
        eyebrow="Dashboard"
        title={`Welcome${session.name ? `, ${session.name}` : ""}`}
        description="Track today’s orders, watch inventory pressure, and jump into the areas that need action first."
        actions={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={isRefreshing}
              onClick={() => void loadOverview()}
            >
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/dashboard/orders">
                <ClipboardList className="size-4" />
                View Orders
              </Link>
            </Button>
            <Button asChild className="rounded-xl">
              <Link href="/dashboard/restock-queue">
                <RefreshCw className="size-4" />
                View Restock Queue
              </Link>
            </Button>
          </div>
        }
      />

      {feedback ? <DashboardFeedbackBanner {...feedback} /> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="Total Orders Today"
          value={isLoading ? "..." : overview?.totalOrdersToday ?? 0}
        />
        <DashboardStatCard
          label="Pending Orders Today"
          value={isLoading ? "..." : overview?.pendingOrdersToday ?? 0}
          description={
            isLoading
              ? undefined
              : `${overview?.completedOrdersToday ?? 0} completed today`
          }
        />
        <DashboardStatCard
          label="Low Stock Items"
          value={isLoading ? "..." : overview?.lowStockItemsCount ?? 0}
          description="Products at or below threshold"
        />
        <DashboardStatCard
          label="Revenue Today"
          value={isLoading ? "..." : formatCurrency(overview?.revenueToday ?? 0)}
          description="Delivered orders created today"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div>
              <h2 className="text-lg font-semibold">Product summary</h2>
              <p className="text-sm text-muted-foreground">
                Products that currently need the most attention.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/dashboard/products">
                <Boxes className="size-4" />
                Products
              </Link>
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {isLoading ? (
              <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
                Loading product insights...
              </div>
            ) : overview?.productSummary.length ? (
              overview.productSummary.map((product) => (
                <div
                  key={product._id}
                  className="flex flex-col gap-3 rounded-2xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-foreground">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.stockQuantity > 0
                        ? `${product.stockQuantity} available`
                        : "0 left"}
                    </p>
                  </div>

                  <span
                    className={cn(
                      "inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                      getInventoryStateClassName(product.inventoryState)
                    )}
                  >
                    {product.inventoryState}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
                No product insights are available yet.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Order health</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Track how many orders still need action compared with delivered orders.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <DashboardStatCard
                label="Pending vs Completed"
                value={
                  isLoading
                    ? "..."
                    : `${overview?.pendingOrdersToday ?? 0} / ${overview?.completedOrdersToday ?? 0}`
                }
                description="Pending / completed today"
              />
              <DashboardStatCard
                label="Low Stock Focus"
                value={isLoading ? "..." : overview?.lowStockItemsCount ?? 0}
                description="Items needing replenishment"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div>
                <h2 className="text-lg font-semibold">Activity log</h2>
                <p className="text-sm text-muted-foreground">
                  The latest operational events across your workspace.
                </p>
              </div>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/dashboard/activity-log">
                  <History className="size-4" />
                  View all
                </Link>
              </Button>
            </div>

            <ActivityLogList
              className="mt-4"
              items={overview?.recentActivities ?? []}
              isLoading={isLoading}
              emptyMessage="No recent activity yet."
              compact
            />
          </div>

          <div className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Quick links</h2>
                <p className="text-sm text-muted-foreground">
                  Jump straight into the workflows that keep inventory moving.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                {
                  href: "/dashboard/categories",
                  label: "Categories",
                  description: "Organize product structure",
                },
                {
                  href: "/dashboard/products",
                  label: "Products",
                  description: "Manage stock and pricing",
                },
                {
                  href: "/dashboard/orders",
                  label: "Orders",
                  description: "Track order fulfillment",
                },
                {
                  href: "/dashboard/restock-queue",
                  label: "Restock Queue",
                  description: "Resolve low-stock items",
                },
                {
                  href: "/dashboard/activity-log",
                  label: "Activity Log",
                  description: "Review recent system actions",
                },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl border border-border/60 p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{link.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
