"use client"

import { History, RefreshCw } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { ActivityLogList } from "@/components/activity-log-list"
import { DashboardFeedbackBanner } from "@/components/dashboard-feedback-banner"
import { DashboardPageHeader } from "@/components/dashboard-page-header"
import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { Button } from "@/components/ui/button"
import { getErrorDetails } from "@/lib/api-error"
import { dashboardSelectClassName } from "@/lib/dashboard-ui"
import {
  ActivityLogService,
  activityLogTypes,
  type ActivityLogItem,
  type ActivityLogType,
} from "@/services/activity-log.service"

type FeedbackState = {
  type: "success" | "error"
  message: string
}

type FiltersState = {
  type: string
  limit: string
}

const initialFilters: FiltersState = {
  type: "",
  limit: "10",
}

function formatActivityType(type: ActivityLogType) {
  return type
    .split("_")
    .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
    .join(" ")
}

export default function ActivityLogPage() {
  const [items, setItems] = useState<ActivityLogItem[]>([])
  const [filters, setFilters] = useState<FiltersState>(initialFilters)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPreviousPage, setHasPreviousPage] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)

  const hasLoadedRef = useRef(false)

  const loadActivityLogs = useCallback(async () => {
    if (hasLoadedRef.current) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    try {
      const result = await ActivityLogService.getActivityLogs({
        type: filters.type || undefined,
        page,
        limit: Number(filters.limit),
      })

      setItems(result.data.items)
      setTotal(result.data.pagination.total)
      setTotalPages(result.data.pagination.totalPages)
      setHasNextPage(result.data.pagination.hasNextPage)
      setHasPreviousPage(result.data.pagination.hasPreviousPage)
      setFeedback(null)
      hasLoadedRef.current = true
    } catch (error) {
      const details = getErrorDetails(error, "Unable to load the activity log right now.")

      setFeedback({
        type: "error",
        message: details.message,
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [filters.limit, filters.type, page])

  useEffect(() => {
    void loadActivityLogs()
  }, [loadActivityLogs])

  function updateFilter<K extends keyof FiltersState>(field: K, value: FiltersState[K]) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }))
    setPage(1)
  }

  function clearFilters() {
    setFilters(initialFilters)
    setPage(1)
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <DashboardPageHeader
        icon={History}
        eyebrow="Activity"
        title="Activity log"
        description="Review the latest operational changes across categories, products, orders, and restock workflows."
        actions={
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={isRefreshing}
            onClick={() => void loadActivityLogs()}
          >
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        }
      />

      {feedback ? <DashboardFeedbackBanner {...feedback} /> : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <DashboardStatCard label="Visible Entries" value={items.length} />
        <DashboardStatCard label="Total Matching" value={total} />
        <DashboardStatCard label="Page" value={`${page} / ${totalPages}`} />
      </section>

      <section className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-4 md:grid-cols-2 lg:flex-1">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="activity-type-filter">
                Event type
              </label>
              <select
                id="activity-type-filter"
                value={filters.type}
                onChange={(event) => updateFilter("type", event.target.value)}
                className={dashboardSelectClassName}
              >
                <option value="">All activity types</option>
                {activityLogTypes.map((type) => (
                  <option key={type} value={type}>
                    {formatActivityType(type)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="activity-limit-filter">
                Page size
              </label>
              <select
                id="activity-limit-filter"
                value={filters.limit}
                onChange={(event) => updateFilter("limit", event.target.value)}
                className={dashboardSelectClassName}
              >
                {[5, 10, 20, 30].map((size) => (
                  <option key={size} value={String(size)}>
                    {size} per page
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={!filters.type && filters.limit === initialFilters.limit}
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Recent actions</h2>
            <p className="text-sm text-muted-foreground">
              {isRefreshing
                ? "Refreshing activity feed..."
                : `${total} matching action${total === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>

        <ActivityLogList
          className="mt-4"
          items={items}
          isLoading={isLoading}
          emptyMessage="No activity entries matched the current filters."
        />

        <div className="mt-5 flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={!hasPreviousPage || isRefreshing}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={!hasNextPage || isRefreshing}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
