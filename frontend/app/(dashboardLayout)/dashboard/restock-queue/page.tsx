"use client"

import {
  AlertTriangle,
  Eye,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { useDashboardSession } from "@/components/dashboard-shell"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { isApiClientError } from "@/services/http"
import {
  restockQueuePriorities,
  restockQueueStatuses,
  type RemoveRestockQueueItemPayload,
  type RestockQueueItem,
  type RestockQueuePriority,
  type RestockQueueRestockPayload,
  type RestockQueueStatus,
  RestockQueueService,
} from "@/services/restock-queue.service"

type FeedbackState = {
  type: "success" | "error"
  message: string
}

type FiltersState = {
  status: string
  priority: string
}

type RestockFormState = {
  stockQuantity: string
  notes: string
}

type RestockFormErrors = {
  stockQuantity?: string
  notes?: string
  form?: string
}

type RemoveFormState = {
  notes: string
}

type RemoveFormErrors = {
  notes?: string
  form?: string
}

type ConfirmAction =
  | {
      type: "restock"
      item: RestockQueueItem
      payload: RestockQueueRestockPayload
    }
  | {
      type: "remove"
      item: RestockQueueItem
      payload: RemoveRestockQueueItemPayload
    }

const initialFilters: FiltersState = {
  status: "",
  priority: "",
}

const initialRestockFormState: RestockFormState = {
  stockQuantity: "",
  notes: "",
}

const initialRemoveFormState: RemoveFormState = {
  notes: "",
}

const selectClassName =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"

const textareaClassName =
  "flex min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

function getErrorDetails(error: unknown, fallbackMessage: string) {
  if (!isApiClientError(error)) {
    return {
      path: "",
      message: fallbackMessage,
    }
  }

  return {
    path: String(error.errorSources[0]?.path ?? ""),
    message: error.errorSources[0]?.message ?? error.message,
  }
}

function formatDate(value?: string) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return dateFormatter.format(date)
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

function normalizeNotes(value: string) {
  const normalizedValue = value.trim()

  return normalizedValue.length > 0 ? normalizedValue : undefined
}

function formatPriority(priority: RestockQueuePriority) {
  return `${priority.charAt(0).toUpperCase()}${priority.slice(1)}`
}

function getPriorityBadgeClassName(priority: RestockQueuePriority) {
  if (priority === "high") {
    return "border-destructive/30 bg-destructive/10 text-destructive"
  }

  if (priority === "medium") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
  }

  return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
}

function getStatusBadgeClassName(status: RestockQueueStatus) {
  if (status === "pending") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
  }

  if (status === "restocked") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  }

  return "border-destructive/30 bg-destructive/10 text-destructive"
}

function getSummaryCounts(items: RestockQueueItem[]) {
  return {
    total: items.length,
    high: items.filter((item) => item.priority === "high").length,
    medium: items.filter((item) => item.priority === "medium").length,
    low: items.filter((item) => item.priority === "low").length,
    pending: items.filter((item) => item.status === "pending").length,
    resolved: items.filter((item) => item.status !== "pending").length,
  }
}

function validateRestockForm(values: RestockFormState) {
  const errors: RestockFormErrors = {}
  const quantityValue = values.stockQuantity.trim()
  let stockQuantity = 0

  if (!quantityValue) {
    errors.stockQuantity = "Stock quantity is required"
  } else {
    stockQuantity = Number(quantityValue)

    if (Number.isNaN(stockQuantity)) {
      errors.stockQuantity = "Stock quantity must be a valid number"
    } else if (!Number.isInteger(stockQuantity)) {
      errors.stockQuantity = "Stock quantity must be an integer"
    } else if (stockQuantity < 0) {
      errors.stockQuantity = "Stock quantity cannot be negative"
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      payload: null,
    }
  }

  return {
    errors,
    payload: {
      stockQuantity,
      notes: normalizeNotes(values.notes),
    },
  }
}

export default function RestockQueuePage() {
  const session = useDashboardSession()
  const [items, setItems] = useState<RestockQueueItem[]>([])
  const [filters, setFilters] = useState<FiltersState>(initialFilters)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [selectedItem, setSelectedItem] = useState<RestockQueueItem | null>(null)
  const [itemDetails, setItemDetails] = useState<RestockQueueItem | null>(null)
  const [itemDetailsError, setItemDetailsError] = useState<string | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isItemDetailsLoading, setIsItemDetailsLoading] = useState(false)
  const [restockDialogItem, setRestockDialogItem] = useState<RestockQueueItem | null>(null)
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false)
  const [restockFormValues, setRestockFormValues] = useState<RestockFormState>(
    initialRestockFormState
  )
  const [restockFormErrors, setRestockFormErrors] = useState<RestockFormErrors>({})
  const [removeDialogItem, setRemoveDialogItem] = useState<RestockQueueItem | null>(null)
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
  const [removeFormValues, setRemoveFormValues] = useState<RemoveFormState>(
    initialRemoveFormState
  )
  const [removeFormErrors, setRemoveFormErrors] = useState<RemoveFormErrors>({})
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [isActionPending, setIsActionPending] = useState(false)

  const hasItemsRef = useRef(false)

  useEffect(() => {
    hasItemsRef.current = items.length > 0
  }, [items.length])

  const canMutate = Boolean(session.userId)

  const loadItems = useCallback(
    async (options?: { preserveFeedback?: boolean }) => {
      if (hasItemsRef.current) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      try {
        const result = await RestockQueueService.getAllRestockQueue({
          status: filters.status || undefined,
          priority: filters.priority || undefined,
        })

        setItems(result.data)

        if (!options?.preserveFeedback) {
          setFeedback(null)
        }
      } catch (error) {
        const details = getErrorDetails(error, "Unable to load the restock queue right now.")

        setFeedback({
          type: "error",
          message: details.message,
        })
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [filters.priority, filters.status]
  )

  const loadItemDetails = useCallback(async (id: string) => {
    setIsItemDetailsLoading(true)
    setItemDetailsError(null)

    try {
      const result = await RestockQueueService.getSingleRestockQueueItem(id)
      setItemDetails(result.data)
    } catch (error) {
      const details = getErrorDetails(error, "Unable to load queue item details right now.")

      setItemDetailsError(details.message)
    } finally {
      setIsItemDetailsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  useEffect(() => {
    if (!isViewDialogOpen || !selectedItem) {
      return
    }

    void loadItemDetails(selectedItem._id)
  }, [isViewDialogOpen, loadItemDetails, selectedItem])

  const summaryCounts = getSummaryCounts(items)
  const hasActiveFilters = Boolean(filters.status || filters.priority)
  const activeDetailItem = itemDetails ?? selectedItem
  const confirmationCopy = getConfirmationCopy(confirmAction)

  function openViewDialog(item: RestockQueueItem) {
    setSelectedItem(item)
    setItemDetails(item)
    setItemDetailsError(null)
    setIsViewDialogOpen(true)
  }

  function openRestockDialog(item: RestockQueueItem) {
    if (!canMutate) {
      setFeedback({
        type: "error",
        message: "Unable to identify the current user for this action.",
      })
      return
    }

    setRestockDialogItem(item)
    setRestockFormValues({
      stockQuantity: String(item.product.stockQuantity),
      notes: "",
    })
    setRestockFormErrors({})
    setIsRestockDialogOpen(true)
  }

  function openRemoveDialog(item: RestockQueueItem) {
    if (!canMutate) {
      setFeedback({
        type: "error",
        message: "Unable to identify the current user for this action.",
      })
      return
    }

    setRemoveDialogItem(item)
    setRemoveFormValues(initialRemoveFormState)
    setRemoveFormErrors({})
    setIsRemoveDialogOpen(true)
  }

  function handleViewDialogOpenChange(nextOpen: boolean) {
    if (isActionPending) {
      return
    }

    setIsViewDialogOpen(nextOpen)

    if (!nextOpen) {
      setSelectedItem(null)
      setItemDetails(null)
      setItemDetailsError(null)
    }
  }

  function handleRestockDialogOpenChange(nextOpen: boolean) {
    if (isActionPending) {
      return
    }

    setIsRestockDialogOpen(nextOpen)

    if (!nextOpen) {
      setRestockDialogItem(null)
      setRestockFormValues(initialRestockFormState)
      setRestockFormErrors({})

      if (confirmAction?.type === "restock") {
        setConfirmAction(null)
      }
    }
  }

  function handleRemoveDialogOpenChange(nextOpen: boolean) {
    if (isActionPending) {
      return
    }

    setIsRemoveDialogOpen(nextOpen)

    if (!nextOpen) {
      setRemoveDialogItem(null)
      setRemoveFormValues(initialRemoveFormState)
      setRemoveFormErrors({})

      if (confirmAction?.type === "remove") {
        setConfirmAction(null)
      }
    }
  }

  function updateFilter<K extends keyof FiltersState>(field: K, value: FiltersState[K]) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function clearFilters() {
    setFilters(initialFilters)
  }

  function updateRestockField<K extends keyof RestockFormState>(
    field: K,
    value: RestockFormState[K]
  ) {
    setRestockFormValues((current) => ({
      ...current,
      [field]: value,
    }))
    setRestockFormErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }))
  }

  function updateRemoveNotes(value: string) {
    setRemoveFormValues({ notes: value })
    setRemoveFormErrors((current) => ({
      ...current,
      notes: undefined,
      form: undefined,
    }))
  }

  function queueRestockAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!restockDialogItem || !session.userId) {
      setRestockFormErrors({
        form: "Unable to identify the current user for this action.",
      })
      return
    }

    const { errors, payload } = validateRestockForm(restockFormValues)

    if (!payload) {
      setRestockFormErrors(errors)
      return
    }

    setConfirmAction({
      type: "restock",
      item: restockDialogItem,
      payload: {
        stockQuantity: payload.stockQuantity,
        updatedBy: session.userId,
        ...(payload.notes ? { notes: payload.notes } : {}),
      },
    })
  }

  function queueRemoveAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!removeDialogItem || !session.userId) {
      setRemoveFormErrors({
        form: "Unable to identify the current user for this action.",
      })
      return
    }

    const notes = normalizeNotes(removeFormValues.notes)

    setConfirmAction({
      type: "remove",
      item: removeDialogItem,
      payload: {
        updatedBy: session.userId,
        ...(notes ? { notes } : {}),
      },
    })
  }

  async function handleConfirmAction() {
    if (!confirmAction) {
      return
    }

    setIsActionPending(true)

    try {
      if (confirmAction.type === "restock") {
        const result = await RestockQueueService.restockQueueItem(
          confirmAction.item._id,
          confirmAction.payload
        )

        setFeedback({
          type: "success",
          message: result.message,
        })
        setIsRestockDialogOpen(false)
        setRestockDialogItem(null)
        setRestockFormValues(initialRestockFormState)
        setRestockFormErrors({})

        if (selectedItem?._id === result.data._id) {
          setSelectedItem(result.data)
          setItemDetails(result.data)
        }

        await loadItems({ preserveFeedback: true })
      }

      if (confirmAction.type === "remove") {
        const result = await RestockQueueService.removeRestockQueueItem(
          confirmAction.item._id,
          confirmAction.payload
        )

        setFeedback({
          type: "success",
          message: result.message,
        })
        setIsRemoveDialogOpen(false)
        setRemoveDialogItem(null)
        setRemoveFormValues(initialRemoveFormState)
        setRemoveFormErrors({})

        if (selectedItem?._id === result.data._id) {
          setSelectedItem(result.data)
          setItemDetails(result.data)
        }

        await loadItems({ preserveFeedback: true })
      }
    } catch (error) {
      const details = getErrorDetails(error, "Unable to complete this action.")

      if (confirmAction.type === "restock") {
        if (details.path.includes("stockQuantity")) {
          setRestockFormErrors({ stockQuantity: details.message })
        } else if (details.path.includes("notes")) {
          setRestockFormErrors({ notes: details.message })
        } else {
          setRestockFormErrors({ form: details.message })
        }
      } else {
        if (details.path.includes("notes")) {
          setRemoveFormErrors({ notes: details.message })
        } else {
          setRemoveFormErrors({ form: details.message })
        }
      }
    } finally {
      setIsActionPending(false)
      setConfirmAction(null)
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-background/90 p-6 shadow-sm backdrop-blur sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
              <AlertTriangle className="size-3.5" />
              Restock Queue
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Restock queue
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Review low-stock products, update replenishment quantities, and resolve
                queue items with a complete operator trail.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={isRefreshing}
            onClick={() => void loadItems()}
          >
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        </div>

        {!canMutate ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            Unable to identify the current user, so restock and remove actions are
            disabled for this session.
          </div>
        ) : null}

        {feedback ? (
          <div
            className={cn(
              "rounded-2xl border px-4 py-3 text-sm",
              feedback.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            )}
          >
            {feedback.message}
          </div>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {[
            { label: "Total", value: summaryCounts.total },
            { label: "High", value: summaryCounts.high },
            { label: "Medium", value: summaryCounts.medium },
            { label: "Low", value: summaryCounts.low },
            { label: "Pending", value: summaryCounts.pending },
            { label: "Resolved", value: summaryCounts.resolved },
          ].map((summary) => (
            <div
              key={summary.label}
              className="rounded-2xl border border-border/60 bg-background px-4 py-4 shadow-sm"
            >
              <p className="text-sm text-muted-foreground">{summary.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{summary.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-4 md:grid-cols-2 lg:flex-1">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="restock-status-filter">
                  Status
                </label>
                <select
                  id="restock-status-filter"
                  value={filters.status}
                  onChange={(event) => updateFilter("status", event.target.value)}
                  className={selectClassName}
                >
                  <option value="">Pending only (default)</option>
                  {restockQueueStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="restock-priority-filter">
                  Priority
                </label>
                <select
                  id="restock-priority-filter"
                  value={filters.priority}
                  onChange={(event) => updateFilter("priority", event.target.value)}
                  className={selectClassName}
                >
                  <option value="">All priorities</option>
                  {restockQueuePriorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {formatPriority(priority)}
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
                disabled={!hasActiveFilters}
                onClick={clearFilters}
              >
                Clear filters
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={isRefreshing}
                onClick={() => void loadItems()}
              >
                Refresh list
              </Button>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-border/60 bg-background shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Queue items</h2>
              <p className="text-sm text-muted-foreground">
                {isRefreshing
                  ? "Refreshing queue items..."
                  : `${items.length} item${items.length === 1 ? "" : "s"} in the current result`}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current stock</TableHead>
                  <TableHead>Minimum</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Updated by</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                      Loading restock queue...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                      No queue items found for the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{item.product.name}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.product.category?.name ?? "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.currentStock}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.minimumStockThreshold}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                            getPriorityBadgeClassName(item.priority)
                          )}
                        >
                          {formatPriority(item.priority)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                            getStatusBadgeClassName(item.status)
                          )}
                        >
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(item.addedAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.updatedBy?.name ?? "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => openViewDialog(item)}
                          >
                            <Eye className="size-4" />
                            View
                          </Button>
                          {item.status === "pending" ? (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                className="rounded-xl"
                                disabled={!canMutate}
                                onClick={() => openRestockDialog(item)}
                              >
                                <RefreshCw className="size-4" />
                                Restock
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                className="rounded-xl"
                                disabled={!canMutate}
                                onClick={() => openRemoveDialog(item)}
                              >
                                <Trash2 className="size-4" />
                                Remove
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>

      <Dialog open={isViewDialogOpen} onOpenChange={handleViewDialogOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {activeDetailItem ? activeDetailItem.product.name : "Queue item details"}
            </DialogTitle>
            <DialogDescription>
              Review stock context, operator notes, and resolve the item if it is still
              pending.
            </DialogDescription>
          </DialogHeader>

          {isItemDetailsLoading ? (
            <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
              Loading queue item details...
            </div>
          ) : itemDetailsError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {itemDetailsError}
            </div>
          ) : activeDetailItem ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">Product</p>
                  <p className="mt-2 font-semibold">{activeDetailItem.product.name}</p>
                </div>
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="mt-2 font-semibold">
                    {activeDetailItem.product.category?.name ?? "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="mt-2 font-semibold">
                    {formatCurrency(activeDetailItem.product.price)}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">Current stock</p>
                  <p className="mt-2 font-semibold">{activeDetailItem.currentStock}</p>
                </div>
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">Minimum threshold</p>
                  <p className="mt-2 font-semibold">{activeDetailItem.minimumStockThreshold}</p>
                </div>
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <div className="mt-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                        getPriorityBadgeClassName(activeDetailItem.priority)
                      )}
                    >
                      {formatPriority(activeDetailItem.priority)}
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                        getStatusBadgeClassName(activeDetailItem.status)
                      )}
                    >
                      {activeDetailItem.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">Added</p>
                  <p className="mt-2 font-medium">{formatDate(activeDetailItem.addedAt)}</p>
                </div>
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="mt-2 font-medium">{formatDate(activeDetailItem.resolvedAt)}</p>
                </div>
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">Updated by</p>
                  <p className="mt-2 font-medium">{activeDetailItem.updatedBy?.name ?? "-"}</p>
                </div>
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">Product status</p>
                  <p className="mt-2 font-medium">{activeDetailItem.product.status}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 p-4">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="mt-2 whitespace-pre-wrap text-sm">
                  {activeDetailItem.notes ?? "No notes recorded for this item."}
                </p>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  disabled={isActionPending}
                  onClick={() => handleViewDialogOpenChange(false)}
                >
                  Close
                </Button>
                {activeDetailItem.status === "pending" ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      disabled={isActionPending || !canMutate}
                      onClick={() => openRestockDialog(activeDetailItem)}
                    >
                      <RefreshCw className="size-4" />
                      Restock
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="rounded-xl"
                      disabled={isActionPending || !canMutate}
                      onClick={() => openRemoveDialog(activeDetailItem)}
                    >
                      <Trash2 className="size-4" />
                      Remove
                    </Button>
                  </>
                ) : null}
              </DialogFooter>
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
              Select an item to review its restock details.
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isRestockDialogOpen} onOpenChange={handleRestockDialogOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {restockDialogItem
                ? `Restock ${restockDialogItem.product.name}`
                : "Restock item"}
            </DialogTitle>
            <DialogDescription>
              Set the new stock quantity, add optional notes, and confirm the update
              before resolving the queue item.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={queueRestockAction}>
            {restockDialogItem ? (
              <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                Current stock: {restockDialogItem.currentStock} · Minimum threshold: {" "}
                {restockDialogItem.minimumStockThreshold}
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="restock-stock-quantity">
                New stock quantity
              </label>
              <Input
                id="restock-stock-quantity"
                type="number"
                min="0"
                step="1"
                placeholder="25"
                value={restockFormValues.stockQuantity}
                onChange={(event) => updateRestockField("stockQuantity", event.target.value)}
                aria-invalid={Boolean(restockFormErrors.stockQuantity)}
                disabled={isActionPending}
              />
              {restockFormErrors.stockQuantity ? (
                <p className="text-sm text-destructive">{restockFormErrors.stockQuantity}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="restock-notes">
                Notes
              </label>
              <textarea
                id="restock-notes"
                value={restockFormValues.notes}
                onChange={(event) => updateRestockField("notes", event.target.value)}
                placeholder="Optional context for this stock update"
                className={cn(textareaClassName, restockFormErrors.notes && "border-destructive")}
                disabled={isActionPending}
              />
              {restockFormErrors.notes ? (
                <p className="text-sm text-destructive">{restockFormErrors.notes}</p>
              ) : null}
            </div>

            {restockFormErrors.form ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {restockFormErrors.form}
              </div>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={isActionPending}
                onClick={() => handleRestockDialogOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl"
                disabled={isActionPending || !canMutate}
              >
                Review restock
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isRemoveDialogOpen} onOpenChange={handleRemoveDialogOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {removeDialogItem ? `Remove ${removeDialogItem.product.name}` : "Remove queue item"}
            </DialogTitle>
            <DialogDescription>
              Add optional notes, then confirm before removing this pending item from the
              queue.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={queueRemoveAction}>
            <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              Removing a queue item does not change inventory. It only marks the pending
              queue entry as removed.
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="remove-notes">
                Notes
              </label>
              <textarea
                id="remove-notes"
                value={removeFormValues.notes}
                onChange={(event) => updateRemoveNotes(event.target.value)}
                placeholder="Optional context for removing this queue item"
                className={cn(textareaClassName, removeFormErrors.notes && "border-destructive")}
                disabled={isActionPending}
              />
              {removeFormErrors.notes ? (
                <p className="text-sm text-destructive">{removeFormErrors.notes}</p>
              ) : null}
            </div>

            {removeFormErrors.form ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {removeFormErrors.form}
              </div>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={isActionPending}
                onClick={() => handleRemoveDialogOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                className="rounded-xl"
                disabled={isActionPending || !canMutate}
              >
                Review removal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(confirmAction)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isActionPending) {
            setConfirmAction(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmationCopy.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmationCopy.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                confirmationCopy.actionVariant === "destructive" &&
                  "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              )}
              disabled={isActionPending}
              onClick={(event) => {
                event.preventDefault()
                void handleConfirmAction()
              }}
            >
              {isActionPending ? confirmationCopy.pendingLabel : confirmationCopy.actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function getConfirmationCopy(confirmAction: ConfirmAction | null) {
  if (!confirmAction) {
    return {
      title: "Confirm action",
      description: "Review this action before proceeding.",
      actionLabel: "Confirm",
      pendingLabel: "Processing...",
      actionVariant: "default" as const,
    }
  }

  if (confirmAction.type === "restock") {
    return {
      title: "Restock item?",
      description:
        `This will set \"${confirmAction.item.product.name}\" to ` +
        `${confirmAction.payload.stockQuantity} units in stock and update the queue entry.`,
      actionLabel: "Confirm restock",
      pendingLabel: "Updating...",
      actionVariant: "default" as const,
    }
  }

  return {
    title: "Remove queue item?",
    description:
      `This will mark \"${confirmAction.item.product.name}\" as removed from the queue. ` +
      "Inventory stock will not change.",
    actionLabel: "Remove item",
    pendingLabel: "Removing...",
    actionVariant: "destructive" as const,
  }
}
