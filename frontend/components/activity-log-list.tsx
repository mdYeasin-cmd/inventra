import { ArrowUpRight } from "lucide-react"
import Link from "next/link"

import { formatDateTime, formatRelativeTime } from "@/lib/dashboard-format"
import { cn } from "@/lib/utils"
import type { ActivityLogItem } from "@/services/activity-log.service"

type ActivityLogListProps = {
  items: ActivityLogItem[]
  isLoading?: boolean
  emptyMessage?: string
  compact?: boolean
  className?: string
}

function getActivityHref(entityType: ActivityLogItem["entityType"]) {
  if (entityType === "category") {
    return "/dashboard/categories"
  }

  if (entityType === "product") {
    return "/dashboard/products"
  }

  if (entityType === "order") {
    return "/dashboard/orders"
  }

  return "/dashboard/restock-queue"
}

export function ActivityLogList({
  items,
  isLoading = false,
  emptyMessage = "No recent activity yet.",
  compact = false,
  className,
}: ActivityLogListProps) {
  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: compact ? 4 : 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-4 text-sm text-muted-foreground"
          >
            Loading activity...
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-border/60 bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground",
          className
        )}
      >
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => {
        const href = getActivityHref(item.entityType)

        return (
          <div
            key={item._id}
            className="rounded-2xl border border-border/60 bg-background px-4 py-4 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <p className="text-sm font-medium leading-6 text-foreground">{item.message}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{formatRelativeTime(item.createdAt)}</span>
                  <span>{formatDateTime(item.createdAt)}</span>
                  <span>{item.actorName || "System"}</span>
                </div>
              </div>

              <Link
                href={href}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                Open
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
