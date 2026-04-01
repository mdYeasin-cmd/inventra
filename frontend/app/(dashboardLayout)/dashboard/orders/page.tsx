"use client"

import {
  Ban,
  Check,
  ClipboardList,
  Eye,
  PackageCheck,
  Plus,
  RefreshCw,
  Trash2,
  Truck,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { DashboardConfirmDialog } from "@/components/dashboard-confirm-dialog"
import { DashboardFeedbackBanner } from "@/components/dashboard-feedback-banner"
import { DashboardPageHeader } from "@/components/dashboard-page-header"
import { DashboardStatCard } from "@/components/dashboard-stat-card"
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
import { getErrorDetails } from "@/lib/api-error"
import { formatCurrency, formatDate } from "@/lib/dashboard-format"
import { dashboardSelectClassName } from "@/lib/dashboard-ui"
import { cn } from "@/lib/utils"
import {
  type CreateOrderPayload,
  type Order,
  type OrderFilters,
  OrderService,
  orderStatuses,
  type OrderStatus,
} from "@/services/order.service"
import { type Product, ProductService } from "@/services/product.service"

type FeedbackState = {
  type: "success" | "error"
  message: string
}

type FiltersState = {
  status: string
  startDate: string
  endDate: string
}

type OrderLineFormState = {
  product: string
  quantity: string
}

type CreateOrderFormState = {
  customerName: string
  products: OrderLineFormState[]
}

type OrderLineErrors = {
  product?: string
  quantity?: string
}

type CreateOrderFormErrors = {
  customerName?: string
  products?: OrderLineErrors[]
  form?: string
}

type ConfirmAction =
  | {
      type: "create"
      payload: CreateOrderPayload
      customerName: string
      itemCount: number
      totalPrice: number
    }
  | {
      type: "status"
      order: Order
      nextStatus: OrderStatus
    }

const initialFilters: FiltersState = {
  status: "",
  startDate: "",
  endDate: "",
}

const initialCreateFormState: CreateOrderFormState = {
  customerName: "",
  products: [{ product: "", quantity: "1" }],
}

function createEmptyLineErrors(length: number) {
  return Array.from({ length }, () => ({}))
}

function formatOrderId(value: string) {
  return `#${value.slice(-8).toUpperCase()}`
}

function getStatusBadgeClassName(status: OrderStatus) {
  if (status === "Pending") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
  }

  if (status === "Confirmed") {
    return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
  }

  if (status === "Shipped") {
    return "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300"
  }

  if (status === "Delivered") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  }

  return "border-destructive/30 bg-destructive/10 text-destructive"
}

function getAllowedNextStatuses(status: OrderStatus) {
  if (status === "Pending") {
    return ["Confirmed", "Cancelled"] as const
  }

  if (status === "Confirmed") {
    return ["Shipped", "Cancelled"] as const
  }

  if (status === "Shipped") {
    return ["Delivered"] as const
  }

  return [] as const
}

function getStatusActionLabel(status: OrderStatus) {
  if (status === "Confirmed") {
    return "Confirm"
  }

  if (status === "Shipped") {
    return "Ship"
  }

  if (status === "Delivered") {
    return "Deliver"
  }

  return "Cancel"
}

function getStatusActionIcon(status: OrderStatus) {
  if (status === "Confirmed") {
    return Check
  }

  if (status === "Shipped") {
    return Truck
  }

  if (status === "Delivered") {
    return PackageCheck
  }

  return Ban
}

function getOrderSummaryCounts(orders: Order[]) {
  return {
    total: orders.length,
    pending: orders.filter((order) => order.status === "Pending").length,
    confirmed: orders.filter((order) => order.status === "Confirmed").length,
    shipped: orders.filter((order) => order.status === "Shipped").length,
    delivered: orders.filter((order) => order.status === "Delivered").length,
    cancelled: orders.filter((order) => order.status === "Cancelled").length,
  }
}

function validateCreateOrderForm(values: CreateOrderFormState, products: Product[]) {
  const errors: CreateOrderFormErrors = {
    products: createEmptyLineErrors(values.products.length),
  }
  const seenProducts = new Set<string>()
  const productMap = new Map(products.map((product) => [product._id, product]))
  const payloadProducts: CreateOrderPayload["products"] = []
  let totalPrice = 0
  let itemCount = 0

  if (!values.customerName.trim()) {
    errors.customerName = "Customer name is required"
  }

  if (values.products.length === 0) {
    errors.form = "At least one product is required"
  }

  values.products.forEach((item, index) => {
    const lineErrors = errors.products?.[index] ?? {}
    const selectedProduct = productMap.get(item.product)
    const quantityValue = item.quantity.trim()
    let quantity = 0

    if (!item.product) {
      lineErrors.product = "Product is required"
    } else if (!selectedProduct) {
      lineErrors.product = "Selected product is no longer available"
    } else if (seenProducts.has(item.product)) {
      lineErrors.product = "This product is already added"
    } else if (selectedProduct.status !== "Active" || selectedProduct.stockQuantity <= 0) {
      lineErrors.product = "This product is currently unavailable"
    }

    if (!quantityValue) {
      lineErrors.quantity = "Quantity is required"
    } else {
      quantity = Number(quantityValue)

      if (Number.isNaN(quantity)) {
        lineErrors.quantity = "Quantity must be a valid number"
      } else if (!Number.isInteger(quantity)) {
        lineErrors.quantity = "Quantity must be an integer"
      } else if (quantity < 1) {
        lineErrors.quantity = "Quantity must be at least 1"
      }
    }

    if (
      !lineErrors.product &&
      !lineErrors.quantity &&
      selectedProduct &&
      quantity > selectedProduct.stockQuantity
    ) {
      lineErrors.quantity = `Only ${selectedProduct.stockQuantity} items available in stock`
    }

    errors.products![index] = lineErrors

    if (!lineErrors.product && !lineErrors.quantity && selectedProduct) {
      seenProducts.add(item.product)
      payloadProducts.push({
        product: item.product,
        quantity,
      })
      totalPrice += selectedProduct.price * quantity
      itemCount += quantity
    }
  })

  const hasLineErrors = (errors.products ?? []).some(
    (lineErrors) => Boolean(lineErrors.product) || Boolean(lineErrors.quantity)
  )

  if (errors.customerName || errors.form || hasLineErrors) {
    return {
      errors,
      payload: null,
      summary: null,
    }
  }

  return {
    errors,
    payload: {
      customerName: values.customerName.trim(),
      products: payloadProducts,
    },
    summary: {
      itemCount,
      totalPrice,
    },
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filters, setFilters] = useState<FiltersState>(initialFilters)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderDetails, setOrderDetails] = useState<Order | null>(null)
  const [orderDetailsError, setOrderDetailsError] = useState<string | null>(null)
  const [isOrderDetailsLoading, setIsOrderDetailsLoading] = useState(false)
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [isProductsLoading, setIsProductsLoading] = useState(false)
  const [createFormValues, setCreateFormValues] = useState<CreateOrderFormState>(
    initialCreateFormState
  )
  const [createFormErrors, setCreateFormErrors] = useState<CreateOrderFormErrors>({
    products: createEmptyLineErrors(initialCreateFormState.products.length),
  })
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [isActionPending, setIsActionPending] = useState(false)

  const hasOrdersRef = useRef(false)

  useEffect(() => {
    hasOrdersRef.current = orders.length > 0
  }, [orders.length])

  const loadOrders = useCallback(
    async (options?: { preserveFeedback?: boolean }) => {
      if (hasOrdersRef.current) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      try {
        const requestFilters: OrderFilters = {}

        if (filters.status) {
          requestFilters.status = filters.status
        }

        if (filters.startDate) {
          requestFilters.startDate = filters.startDate
        }

        if (filters.endDate) {
          requestFilters.endDate = filters.endDate
        }

        const result = await OrderService.getAllOrders(requestFilters)

        setOrders(result.data)

        if (!options?.preserveFeedback) {
          setFeedback(null)
        }
      } catch (error) {
        const details = getErrorDetails(error, "Unable to load orders right now.")

        setFeedback({
          type: "error",
          message: details.message,
        })
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [filters.endDate, filters.startDate, filters.status]
  )

  const loadAvailableProducts = useCallback(async () => {
    setIsProductsLoading(true)

    try {
      const result = await ProductService.getAllProducts()

      setAvailableProducts(result.data)
      setCreateFormErrors((current) => ({
        ...current,
        form: undefined,
      }))
    } catch (error) {
      const details = getErrorDetails(error, "Unable to load products for ordering right now.")

      setAvailableProducts([])
      setCreateFormErrors((current) => ({
        ...current,
        form: details.message,
      }))
    } finally {
      setIsProductsLoading(false)
    }
  }, [])

  const loadOrderDetails = useCallback(async (orderId: string) => {
    setIsOrderDetailsLoading(true)
    setOrderDetailsError(null)

    try {
      const result = await OrderService.getSingleOrder(orderId)
      setOrderDetails(result.data)
    } catch (error) {
      const details = getErrorDetails(error, "Unable to load order details right now.")

      setOrderDetailsError(details.message)
    } finally {
      setIsOrderDetailsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  useEffect(() => {
    if (!isCreateDialogOpen) {
      return
    }

    void loadAvailableProducts()
  }, [isCreateDialogOpen, loadAvailableProducts])

  useEffect(() => {
    if (!isViewDialogOpen || !selectedOrder) {
      return
    }

    void loadOrderDetails(selectedOrder._id)
  }, [isViewDialogOpen, loadOrderDetails, selectedOrder])

  const orderableProducts = availableProducts.filter(
    (product) => product.status === "Active" && product.stockQuantity > 0
  )
  const summaryCounts = getOrderSummaryCounts(orders)
  const hasActiveFilters = Boolean(filters.status || filters.startDate || filters.endDate)
  const activeDetailOrder = orderDetails ?? selectedOrder
  const confirmationCopy = getConfirmationCopy(confirmAction)

  function openCreateDialog() {
    setCreateFormValues(initialCreateFormState)
    setCreateFormErrors({
      products: createEmptyLineErrors(initialCreateFormState.products.length),
    })
    setFeedback(null)
    setIsCreateDialogOpen(true)
  }

  function openViewDialog(order: Order) {
    setSelectedOrder(order)
    setOrderDetails(order)
    setOrderDetailsError(null)
    setIsViewDialogOpen(true)
  }

  function handleCreateDialogOpenChange(nextOpen: boolean) {
    if (isActionPending) {
      return
    }

    setIsCreateDialogOpen(nextOpen)

    if (!nextOpen) {
      setCreateFormValues(initialCreateFormState)
      setCreateFormErrors({
        products: createEmptyLineErrors(initialCreateFormState.products.length),
      })

      if (confirmAction?.type === "create") {
        setConfirmAction(null)
      }
    }
  }

  function handleViewDialogOpenChange(nextOpen: boolean) {
    if (isActionPending) {
      return
    }

    setIsViewDialogOpen(nextOpen)

    if (!nextOpen) {
      if (confirmAction?.type === "status" && selectedOrder) {
        setConfirmAction((current) => {
          if (current?.type === "status" && current.order._id === selectedOrder._id) {
            return null
          }

          return current
        })
      }

      setSelectedOrder(null)
      setOrderDetails(null)
      setOrderDetailsError(null)
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

  function updateCustomerName(value: string) {
    setCreateFormValues((current) => ({
      ...current,
      customerName: value,
    }))
    setCreateFormErrors((current) => ({
      ...current,
      customerName: undefined,
      form: undefined,
    }))
  }

  function updateProductLine<K extends keyof OrderLineFormState>(
    index: number,
    field: K,
    value: OrderLineFormState[K]
  ) {
    setCreateFormValues((current) => ({
      ...current,
      products: current.products.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      ),
    }))

    setCreateFormErrors((current) => {
      const nextProductErrors = createEmptyLineErrors(createFormValues.products.length)

      current.products?.forEach((lineErrors, lineIndex) => {
        nextProductErrors[lineIndex] = { ...lineErrors }
      })

      nextProductErrors[index] = {
        ...nextProductErrors[index],
        [field]: undefined,
      }

      return {
        ...current,
        products: nextProductErrors,
        form: undefined,
      }
    })
  }

  function addProductLine() {
    setCreateFormValues((current) => ({
      ...current,
      products: [...current.products, { product: "", quantity: "1" }],
    }))
    setCreateFormErrors((current) => ({
      ...current,
      products: [...(current.products ?? []), {}],
      form: undefined,
    }))
  }

  function removeProductLine(index: number) {
    setCreateFormValues((current) => {
      const nextProducts = current.products.filter((_, itemIndex) => itemIndex !== index)

      return {
        ...current,
        products: nextProducts.length > 0 ? nextProducts : [{ product: "", quantity: "1" }],
      }
    })

    setCreateFormErrors((current) => {
      const nextProducts = (current.products ?? []).filter((_, itemIndex) => itemIndex !== index)

      return {
        ...current,
        products: nextProducts.length > 0 ? nextProducts : [{}],
        form: undefined,
      }
    })
  }

  function queueCreateAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const { errors, payload, summary } = validateCreateOrderForm(
      createFormValues,
      availableProducts
    )

    if (!payload || !summary) {
      setCreateFormErrors(errors)
      return
    }

    setConfirmAction({
      type: "create",
      payload,
      customerName: payload.customerName,
      itemCount: summary.itemCount,
      totalPrice: summary.totalPrice,
    })
  }

  function queueStatusAction(order: Order, nextStatus: OrderStatus) {
    setFeedback(null)
    setConfirmAction({
      type: "status",
      order,
      nextStatus,
    })
  }

  async function handleConfirmAction() {
    if (!confirmAction) {
      return
    }

    setIsActionPending(true)

    try {
      if (confirmAction.type === "create") {
        const result = await OrderService.createOrder(confirmAction.payload)

        setFeedback({
          type: "success",
          message: result.message,
        })
        setIsCreateDialogOpen(false)
        setCreateFormValues(initialCreateFormState)
        setCreateFormErrors({
          products: createEmptyLineErrors(initialCreateFormState.products.length),
        })
        await loadOrders({ preserveFeedback: true })
      }

      if (confirmAction.type === "status") {
        const result = await OrderService.updateOrderStatus(confirmAction.order._id, {
          status: confirmAction.nextStatus,
        })

        setFeedback({
          type: "success",
          message: result.message,
        })

        if (selectedOrder?._id === result.data._id) {
          setSelectedOrder(result.data)
          setOrderDetails(result.data)
        }

        await loadOrders({ preserveFeedback: true })
      }
    } catch (error) {
      const details = getErrorDetails(error, "Unable to complete this action.")

      if (confirmAction.type === "create") {
        if (details.path.includes("customerName")) {
          setCreateFormErrors((current) => ({
            ...current,
            customerName: details.message,
          }))
        } else {
          const lineMatch = details.path.match(/^products\.(\d+)\.(product|quantity)$/)

          if (lineMatch) {
            const lineIndex = Number(lineMatch[1])
            const field = lineMatch[2] as keyof OrderLineErrors

            setCreateFormErrors((current) => {
              const nextProductErrors = createEmptyLineErrors(createFormValues.products.length)

              current.products?.forEach((lineErrors, index) => {
                nextProductErrors[index] = { ...lineErrors }
              })

              nextProductErrors[lineIndex] = {
                ...nextProductErrors[lineIndex],
                [field]: details.message,
              }

              return {
                ...current,
                products: nextProductErrors,
              }
            })
          } else {
            setCreateFormErrors((current) => ({
              ...current,
              form: details.message,
            }))
          }
        }
      } else {
        setFeedback({
          type: "error",
          message: details.message,
        })
      }
    } finally {
      setIsActionPending(false)
      setConfirmAction(null)
    }
  }

  return (
    <>
      <div className="space-y-6">
        <DashboardPageHeader
          icon={ClipboardList}
          eyebrow="Orders"
          title="Order management"
          description="Create customer orders, track fulfillment, and move each order through the inventory workflow."
          actions={
            <Button type="button" className="h-10 rounded-xl px-4" onClick={openCreateDialog}>
              <Plus className="size-4" />
              Create Order
            </Button>
          }
        />

        {feedback ? <DashboardFeedbackBanner {...feedback} /> : null}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {[
            { label: "Total", value: summaryCounts.total },
            { label: "Pending", value: summaryCounts.pending },
            { label: "Confirmed", value: summaryCounts.confirmed },
            { label: "Shipped", value: summaryCounts.shipped },
            { label: "Delivered", value: summaryCounts.delivered },
            { label: "Cancelled", value: summaryCounts.cancelled },
          ].map((summary) => (
            <DashboardStatCard key={summary.label} label={summary.label} value={summary.value} />
          ))}
        </section>

        <section className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-4 md:grid-cols-3 lg:flex-1">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="order-status-filter">
                  Status
                </label>
                <select
                  id="order-status-filter"
                  value={filters.status}
                  onChange={(event) => updateFilter("status", event.target.value)}
                  className={dashboardSelectClassName}
                >
                  <option value="">All statuses</option>
                  {orderStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="order-start-date-filter">
                  Start date
                </label>
                <Input
                  id="order-start-date-filter"
                  type="date"
                  value={filters.startDate}
                  onChange={(event) => updateFilter("startDate", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="order-end-date-filter">
                  End date
                </label>
                <Input
                  id="order-end-date-filter"
                  type="date"
                  value={filters.endDate}
                  onChange={(event) => updateFilter("endDate", event.target.value)}
                />
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
                onClick={() => void loadOrders()}
              >
                <RefreshCw className="size-4" />
                Refresh
              </Button>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-border/60 bg-background shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Order list</h2>
              <p className="text-sm text-muted-foreground">
                {isRefreshing
                  ? "Refreshing orders..."
                  : `${orders.length} order${orders.length === 1 ? "" : "s"} found`}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                      Loading orders...
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                      No orders found. Create your first order to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell>
                        <div className="font-medium text-foreground" title={order._id}>
                          {formatOrderId(order._id)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{order.customerName}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {order.products.length} line{order.products.length === 1 ? "" : "s"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatCurrency(order.totalPrice)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                            getStatusBadgeClassName(order.status)
                          )}
                        >
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(order.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => openViewDialog(order)}
                          >
                            <Eye className="size-4" />
                            View
                          </Button>
                          {getAllowedNextStatuses(order.status).map((nextStatus) => {
                            const Icon = getStatusActionIcon(nextStatus)

                            return (
                              <Button
                                key={nextStatus}
                                type="button"
                                variant={nextStatus === "Cancelled" ? "destructive" : "outline"}
                                className="rounded-xl"
                                onClick={() => queueStatusAction(order, nextStatus)}
                              >
                                <Icon className="size-4" />
                                {getStatusActionLabel(nextStatus)}
                              </Button>
                            )
                          })}
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

      <Dialog open={isCreateDialogOpen} onOpenChange={handleCreateDialogOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create order</DialogTitle>
            <DialogDescription>
              Build the order first, then confirm it. Creating an order reserves stock
              immediately.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={queueCreateAction}>
            {isProductsLoading ? (
              <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                Loading products for order creation...
              </div>
            ) : null}

            {!isProductsLoading && orderableProducts.length === 0 ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                No active products with available stock are ready for ordering.
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="order-customer-name">
                Customer name
              </label>
              <Input
                id="order-customer-name"
                name="customerName"
                placeholder="John Doe"
                value={createFormValues.customerName}
                onChange={(event) => updateCustomerName(event.target.value)}
                aria-invalid={Boolean(createFormErrors.customerName)}
                disabled={isActionPending}
              />
              {createFormErrors.customerName ? (
                <p className="text-sm text-destructive">{createFormErrors.customerName}</p>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Order items</h3>
                  <p className="text-sm text-muted-foreground">
                    Add one or more products with the requested quantity.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  disabled={isActionPending || isProductsLoading}
                  onClick={addProductLine}
                >
                  <Plus className="size-4" />
                  Add item
                </Button>
              </div>

              <div className="space-y-4">
                {createFormValues.products.map((item, index) => {
                  const selectedProduct = availableProducts.find(
                    (product) => product._id === item.product
                  )
                  const quantity = Number(item.quantity)
                  const lineTotal =
                    selectedProduct && !Number.isNaN(quantity) ? selectedProduct.price * quantity : 0

                  return (
                    <div
                      key={`${index}-${item.product}`}
                      className="rounded-2xl border border-border/60 p-4"
                    >
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,0.8fr)_auto] lg:items-start">
                        <div className="space-y-2">
                          <label className="text-sm font-medium" htmlFor={`order-product-${index}`}>
                            Product
                          </label>
                          <select
                            id={`order-product-${index}`}
                            value={item.product}
                            onChange={(event) =>
                              updateProductLine(index, "product", event.target.value)
                            }
                            aria-invalid={Boolean(createFormErrors.products?.[index]?.product)}
                            disabled={isActionPending || isProductsLoading}
                            className={cn(
                              dashboardSelectClassName,
                              createFormErrors.products?.[index]?.product && "border-destructive"
                            )}
                          >
                            <option value="">Select a product</option>
                            {orderableProducts.map((product) => (
                              <option key={product._id} value={product._id}>
                                {product.name} ({product.stockQuantity} in stock)
                              </option>
                            ))}
                          </select>
                          {createFormErrors.products?.[index]?.product ? (
                            <p className="text-sm text-destructive">
                              {createFormErrors.products[index]?.product}
                            </p>
                          ) : null}
                          <div className="text-xs text-muted-foreground">
                            {selectedProduct
                              ? `${selectedProduct.stockQuantity} available · ${formatCurrency(selectedProduct.price)} each`
                              : "Select a product to view stock and price"}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label
                            className="text-sm font-medium"
                            htmlFor={`order-quantity-${index}`}
                          >
                            Quantity
                          </label>
                          <Input
                            id={`order-quantity-${index}`}
                            type="number"
                            min="1"
                            step="1"
                            placeholder="1"
                            value={item.quantity}
                            onChange={(event) =>
                              updateProductLine(index, "quantity", event.target.value)
                            }
                            aria-invalid={Boolean(createFormErrors.products?.[index]?.quantity)}
                            disabled={isActionPending}
                          />
                          {createFormErrors.products?.[index]?.quantity ? (
                            <p className="text-sm text-destructive">
                              {createFormErrors.products[index]?.quantity}
                            </p>
                          ) : null}
                          <div className="text-xs text-muted-foreground">
                            Line total: {formatCurrency(lineTotal)}
                          </div>
                        </div>

                        <div className="flex items-end lg:justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl"
                            disabled={isActionPending || createFormValues.products.length === 1}
                            onClick={() => removeProductLine(index)}
                          >
                            <Trash2 className="size-4" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Order total</span>
                <span className="font-semibold">
                  {formatCurrency(
                    createFormValues.products.reduce((total, item) => {
                      const selectedProduct = availableProducts.find(
                        (product) => product._id === item.product
                      )
                      const quantity = Number(item.quantity)

                      if (!selectedProduct || Number.isNaN(quantity) || quantity < 1) {
                        return total
                      }

                      return total + selectedProduct.price * quantity
                    }, 0)
                  )}
                </span>
              </div>
            </div>

            {createFormErrors.form ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {createFormErrors.form}
              </div>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={isActionPending}
                onClick={() => handleCreateDialogOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl"
                disabled={
                  isActionPending || isProductsLoading || orderableProducts.length === 0
                }
              >
                Review Order
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={handleViewDialogOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {activeDetailOrder ? `Order ${formatOrderId(activeDetailOrder._id)}` : "Order details"}
            </DialogTitle>
            <DialogDescription>
              Review the order snapshot and move it to the next valid status.
            </DialogDescription>
          </DialogHeader>

          {isOrderDetailsLoading ? (
            <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
              Loading order details...
            </div>
          ) : orderDetailsError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {orderDetailsError}
            </div>
          ) : activeDetailOrder ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="mt-2 font-semibold">{activeDetailOrder.customerName}</p>
                </div>
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                        getStatusBadgeClassName(activeDetailOrder.status)
                      )}
                    >
                      {activeDetailOrder.status}
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="mt-2 font-semibold">{formatCurrency(activeDetailOrder.totalPrice)}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="mt-2 font-medium">{formatDate(activeDetailOrder.createdAt)}</p>
                </div>
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">Updated</p>
                  <p className="mt-2 font-medium">{formatDate(activeDetailOrder.updatedAt)}</p>
                </div>
              </div>

              <section className="overflow-hidden rounded-2xl border border-border/60">
                <div className="border-b border-border/60 px-4 py-3">
                  <h3 className="font-medium">Ordered items</h3>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit price</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeDetailOrder.products.map((item, index) => (
                        <TableRow key={`${item.product}-${index}`}>
                          <TableCell>
                            <div className="font-medium text-foreground">{item.name}</div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{item.quantity}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatCurrency(item.price)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatCurrency(item.price * item.quantity)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>

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
                {getAllowedNextStatuses(activeDetailOrder.status).map((nextStatus) => {
                  const Icon = getStatusActionIcon(nextStatus)

                  return (
                    <Button
                      key={nextStatus}
                      type="button"
                      variant={nextStatus === "Cancelled" ? "destructive" : "outline"}
                      className="rounded-xl"
                      disabled={isActionPending}
                      onClick={() => queueStatusAction(activeDetailOrder, nextStatus)}
                    >
                      <Icon className="size-4" />
                      {getStatusActionLabel(nextStatus)}
                    </Button>
                  )
                })}
              </DialogFooter>
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
              Select an order to review its details.
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DashboardConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmationCopy.title}
        description={confirmationCopy.description}
        actionLabel={confirmationCopy.actionLabel}
        pendingLabel={confirmationCopy.pendingLabel}
        actionVariant={confirmationCopy.actionVariant}
        isPending={isActionPending}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isActionPending) {
            setConfirmAction(null)
          }
        }}
        onConfirm={() => {
          void handleConfirmAction()
        }}
      />
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

  if (confirmAction.type === "create") {
    return {
      title: "Create order?",
      description:
        `This will create an order for \"${confirmAction.customerName}\" with ` +
        `${confirmAction.itemCount} item${confirmAction.itemCount === 1 ? "" : "s"} totaling ` +
        `${formatCurrency(confirmAction.totalPrice)}. Stock will be reserved immediately.`,
      actionLabel: "Create order",
      pendingLabel: "Creating...",
      actionVariant: "default" as const,
    }
  }

  if (confirmAction.nextStatus === "Confirmed") {
    return {
      title: "Confirm order?",
      description: `This will mark order \"${formatOrderId(confirmAction.order._id)}\" as confirmed.`,
      actionLabel: "Confirm order",
      pendingLabel: "Confirming...",
      actionVariant: "default" as const,
    }
  }

  if (confirmAction.nextStatus === "Shipped") {
    return {
      title: "Mark as shipped?",
      description: `This will mark order \"${formatOrderId(confirmAction.order._id)}\" as shipped.`,
      actionLabel: "Mark shipped",
      pendingLabel: "Updating...",
      actionVariant: "default" as const,
    }
  }

  if (confirmAction.nextStatus === "Delivered") {
    return {
      title: "Mark as delivered?",
      description: `This will mark order \"${formatOrderId(confirmAction.order._id)}\" as delivered.`,
      actionLabel: "Mark delivered",
      pendingLabel: "Updating...",
      actionVariant: "default" as const,
    }
  }

  return {
    title: "Cancel order?",
    description:
      `This will cancel order \"${formatOrderId(confirmAction.order._id)}\" and restore the reserved stock.`,
    actionLabel: "Cancel order",
    pendingLabel: "Cancelling...",
    actionVariant: "destructive" as const,
  }
}
