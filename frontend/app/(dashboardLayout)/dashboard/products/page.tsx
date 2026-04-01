"use client"

import { Boxes, Pencil, Plus, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import { DashboardConfirmDialog } from "@/components/dashboard-confirm-dialog"
import { DashboardFeedbackBanner } from "@/components/dashboard-feedback-banner"
import { DashboardPageHeader } from "@/components/dashboard-page-header"
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
import { formatDate, formatNumber } from "@/lib/dashboard-format"
import { cn } from "@/lib/utils"
import {
  type Category,
  CategoryService,
} from "@/services/category.service"
import {
  type Product,
  ProductService,
  type ProductPayload,
} from "@/services/product.service"

type FeedbackState = {
  type: "success" | "error"
  message: string
}

type FormState = {
  name: string
  category: string
  price: string
  stockQuantity: string
  minimumStockThreshold: string
}

type FormErrors = {
  name?: string
  category?: string
  price?: string
  stockQuantity?: string
  minimumStockThreshold?: string
  form?: string
}

type ConfirmAction =
  | {
      type: "create"
      payload: ProductPayload
    }
  | {
      type: "update"
      product: Product
      payload: ProductPayload
    }
  | {
      type: "delete"
      product: Product
    }

const initialFormState: FormState = {
  name: "",
  category: "",
  price: "",
  stockQuantity: "",
  minimumStockThreshold: "",
}

function validateForm(values: FormState, hasCategories: boolean) {
  const errors: FormErrors = {}

  if (!values.name.trim()) {
    errors.name = "Product name is required"
  }

  if (!hasCategories) {
    errors.category = "Create a category before adding products"
  } else if (!values.category.trim()) {
    errors.category = "Category is required"
  }

  const priceValue = values.price.trim()
  const stockQuantityValue = values.stockQuantity.trim()
  const thresholdValue = values.minimumStockThreshold.trim()

  let price = 0
  let stockQuantity = 0
  let minimumStockThreshold = 0

  if (!priceValue) {
    errors.price = "Price is required"
  } else {
    price = Number(priceValue)

    if (Number.isNaN(price)) {
      errors.price = "Price must be a valid number"
    } else if (price < 0) {
      errors.price = "Price cannot be negative"
    }
  }

  if (!stockQuantityValue) {
    errors.stockQuantity = "Stock quantity is required"
  } else {
    stockQuantity = Number(stockQuantityValue)

    if (Number.isNaN(stockQuantity)) {
      errors.stockQuantity = "Stock quantity must be a valid number"
    } else if (!Number.isInteger(stockQuantity)) {
      errors.stockQuantity = "Stock quantity must be an integer"
    } else if (stockQuantity < 0) {
      errors.stockQuantity = "Stock quantity cannot be negative"
    }
  }

  if (!thresholdValue) {
    errors.minimumStockThreshold = "Minimum stock threshold is required"
  } else {
    minimumStockThreshold = Number(thresholdValue)

    if (Number.isNaN(minimumStockThreshold)) {
      errors.minimumStockThreshold = "Minimum stock threshold must be a valid number"
    } else if (!Number.isInteger(minimumStockThreshold)) {
      errors.minimumStockThreshold = "Minimum stock threshold must be an integer"
    } else if (minimumStockThreshold < 0) {
      errors.minimumStockThreshold = "Minimum stock threshold cannot be negative"
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
      name: values.name.trim(),
      category: values.category.trim(),
      price,
      stockQuantity,
      minimumStockThreshold,
    },
  }
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [formValues, setFormValues] = useState<FormState>(initialFormState)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [isActionPending, setIsActionPending] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading((current) => current || (products.length === 0 && categories.length === 0))
    setIsRefreshing((current) => current || products.length > 0 || categories.length > 0)

    const [productsResult, categoriesResult] = await Promise.allSettled([
      ProductService.getAllProducts(),
      CategoryService.getAllCategories(),
    ])

    if (productsResult.status === "fulfilled") {
      setProducts(productsResult.value.data)
    }

    if (categoriesResult.status === "fulfilled") {
      setCategories(categoriesResult.value.data)
    }

    if (productsResult.status === "fulfilled" && categoriesResult.status === "fulfilled") {
      setFeedback(null)
      setIsLoading(false)
      setIsRefreshing(false)
      return
    }

    const failedResult: unknown =
      productsResult.status === "rejected"
        ? productsResult.reason
        : categoriesResult.status === "rejected"
          ? categoriesResult.reason
          : null
    const details = getErrorDetails(failedResult, "Unable to load products right now.")

    setFeedback({
      type: "error",
      message: details.message,
    })
    setIsLoading(false)
    setIsRefreshing(false)
  }, [categories.length, products.length])

  useEffect(() => {
    void loadData()
  }, [loadData])

  function openCreateDialog() {
    setEditingProduct(null)
    setFormValues({
      ...initialFormState,
      category: categories[0]?._id ?? "",
    })
    setFormErrors({})
    setFeedback(null)
    setIsDialogOpen(true)
  }

  function openEditDialog(product: Product) {
    setEditingProduct(product)
    setFormValues({
      name: product.name,
      category: product.category._id,
      price: String(product.price),
      stockQuantity: String(product.stockQuantity),
      minimumStockThreshold: String(product.minimumStockThreshold),
    })
    setFormErrors({})
    setFeedback(null)
    setIsDialogOpen(true)
  }

  function handleDialogOpenChange(nextOpen: boolean) {
    if (isActionPending) {
      return
    }

    setIsDialogOpen(nextOpen)

    if (!nextOpen) {
      setEditingProduct(null)
      setFormErrors({})
      setConfirmAction(null)
    }
  }

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }))
    setFormErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }))
  }

  function queueSaveAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const { errors, payload } = validateForm(formValues, categories.length > 0)

    if (!payload) {
      setFormErrors(errors)
      return
    }

    if (editingProduct) {
      setConfirmAction({
        type: "update",
        product: editingProduct,
        payload,
      })
      return
    }

    setConfirmAction({
      type: "create",
      payload,
    })
  }

  function queueDeleteAction(product: Product) {
    setFeedback(null)
    setConfirmAction({
      type: "delete",
      product,
    })
  }

  async function handleConfirmAction() {
    if (!confirmAction) {
      return
    }

    setIsActionPending(true)

    try {
      if (confirmAction.type === "create") {
        const result = await ProductService.createProduct(confirmAction.payload)

        setProducts((current) => [result.data, ...current])
        setFeedback({
          type: "success",
          message: result.message,
        })
        setIsDialogOpen(false)
        setFormValues(initialFormState)
        setFormErrors({})
      }

      if (confirmAction.type === "update") {
        const result = await ProductService.updateProduct(
          confirmAction.product._id,
          confirmAction.payload
        )

        setProducts((current) =>
          current.map((product) =>
            product._id === result.data._id ? result.data : product
          )
        )
        setFeedback({
          type: "success",
          message: result.message,
        })
        setIsDialogOpen(false)
        setEditingProduct(null)
        setFormValues(initialFormState)
        setFormErrors({})
      }

      if (confirmAction.type === "delete") {
        const result = await ProductService.deleteProduct(confirmAction.product._id)

        setProducts((current) =>
          current.filter((product) => product._id !== confirmAction.product._id)
        )
        setFeedback({
          type: "success",
          message: result.message,
        })
      }
    } catch (error) {
      const details = getErrorDetails(error, "Unable to complete this action.")

      if (confirmAction.type === "create" || confirmAction.type === "update") {
        if (details.path.includes("name")) {
          setFormErrors({ name: details.message })
        } else if (details.path.includes("category")) {
          setFormErrors({ category: details.message })
        } else if (details.path.includes("price")) {
          setFormErrors({ price: details.message })
        } else if (details.path.includes("stockQuantity")) {
          setFormErrors({ stockQuantity: details.message })
        } else if (details.path.includes("minimumStockThreshold")) {
          setFormErrors({ minimumStockThreshold: details.message })
        } else {
          setFormErrors({ form: details.message })
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

  const isEditing = Boolean(editingProduct)
  const hasCategories = categories.length > 0
  const lowStockCount = products.filter((product) => product.isLowStock).length
  const confirmationCopy = getConfirmationCopy(confirmAction)

  return (
    <>
      <div className="space-y-6">
        <DashboardPageHeader
          icon={Boxes}
          eyebrow="Products"
          title="Product management"
          description="Create, update, and review your inventory items from one table."
          actions={
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <Button
                type="button"
                className="h-10 rounded-xl px-4"
                disabled={!hasCategories && !isLoading}
                onClick={openCreateDialog}
              >
                <Plus className="size-4" />
                Add Product
              </Button>
              {!hasCategories && !isLoading ? (
                <p className="text-xs text-muted-foreground sm:text-right">
                  Create at least one category before adding products.
                </p>
              ) : null}
            </div>
          }
        />

        {feedback ? <DashboardFeedbackBanner {...feedback} /> : null}

        <section className="overflow-hidden rounded-3xl border border-border/60 bg-background shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Product list</h2>
              <p className="text-sm text-muted-foreground">
                {isRefreshing
                  ? "Refreshing products..."
                  : `${products.length} product${products.length === 1 ? "" : "s"} available${lowStockCount > 0 ? `, ${lowStockCount} low stock` : ""}`}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={isRefreshing}
              onClick={() => void loadData()}
            >
              Refresh
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Minimum</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                      Loading products...
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                      No products found. Add your first product to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{product.name}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.category?.name ?? "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatNumber(product.price)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatNumber(product.stockQuantity)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatNumber(product.minimumStockThreshold)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span
                            className={cn(
                              "inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                              product.status === "Out of Stock"
                                ? "border-destructive/30 bg-destructive/10 text-destructive"
                                : product.isLowStock
                                  ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            )}
                          >
                            {product.status}
                          </span>
                          {product.isLowStock ? (
                            <span className="text-xs text-amber-700 dark:text-amber-300">
                              Low stock
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(product.createdAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(product.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl"
                            disabled={!hasCategories}
                            onClick={() => openEditDialog(product)}
                          >
                            <Pencil className="size-4" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            className="rounded-xl"
                            onClick={() => queueDeleteAction(product)}
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </Button>
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

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit product" : "Add product"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the product details, then confirm the change before saving it."
                : "Add the product details, then confirm before creating it."}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={queueSaveAction}>
            {!hasCategories ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                You need at least one category before you can save a product.
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium" htmlFor="product-name">
                  Product name
                </label>
                <Input
                  id="product-name"
                  name="name"
                  placeholder="Wireless Keyboard"
                  value={formValues.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  aria-invalid={Boolean(formErrors.name)}
                  disabled={isActionPending}
                />
                {formErrors.name ? (
                  <p className="text-sm text-destructive">{formErrors.name}</p>
                ) : null}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium" htmlFor="product-category">
                  Category
                </label>
                <select
                  id="product-category"
                  name="category"
                  value={formValues.category}
                  onChange={(event) => updateField("category", event.target.value)}
                  aria-invalid={Boolean(formErrors.category)}
                  disabled={isActionPending || !hasCategories}
                  className={cn(
                    "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50",
                    formErrors.category && "border-destructive"
                  )}
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {formErrors.category ? (
                  <p className="text-sm text-destructive">{formErrors.category}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="product-price">
                  Price
                </label>
                <Input
                  id="product-price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="999"
                  value={formValues.price}
                  onChange={(event) => updateField("price", event.target.value)}
                  aria-invalid={Boolean(formErrors.price)}
                  disabled={isActionPending}
                />
                {formErrors.price ? (
                  <p className="text-sm text-destructive">{formErrors.price}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="product-stock-quantity">
                  Stock quantity
                </label>
                <Input
                  id="product-stock-quantity"
                  name="stockQuantity"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="20"
                  value={formValues.stockQuantity}
                  onChange={(event) => updateField("stockQuantity", event.target.value)}
                  aria-invalid={Boolean(formErrors.stockQuantity)}
                  disabled={isActionPending}
                />
                {formErrors.stockQuantity ? (
                  <p className="text-sm text-destructive">{formErrors.stockQuantity}</p>
                ) : null}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium" htmlFor="product-minimum-stock-threshold">
                  Minimum stock threshold
                </label>
                <Input
                  id="product-minimum-stock-threshold"
                  name="minimumStockThreshold"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="5"
                  value={formValues.minimumStockThreshold}
                  onChange={(event) =>
                    updateField("minimumStockThreshold", event.target.value)
                  }
                  aria-invalid={Boolean(formErrors.minimumStockThreshold)}
                  disabled={isActionPending}
                />
                {formErrors.minimumStockThreshold ? (
                  <p className="text-sm text-destructive">
                    {formErrors.minimumStockThreshold}
                  </p>
                ) : null}
              </div>
            </div>

            {formErrors.form ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {formErrors.form}
              </div>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={isActionPending}
                onClick={() => handleDialogOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl"
                disabled={isActionPending || !hasCategories}
              >
                {isEditing ? "Review update" : "Review create"}
              </Button>
            </DialogFooter>
          </form>
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
      title: "Create product?",
      description: `This will create the product \"${confirmAction.payload.name}\".`,
      actionLabel: "Create product",
      pendingLabel: "Creating...",
      actionVariant: "default" as const,
    }
  }

  if (confirmAction.type === "update") {
    return {
      title: "Update product?",
      description: `This will update \"${confirmAction.product.name}\" to \"${confirmAction.payload.name}\".`,
      actionLabel: "Save changes",
      pendingLabel: "Saving...",
      actionVariant: "default" as const,
    }
  }

  return {
    title: "Delete product?",
    description:
      `This will delete \"${confirmAction.product.name}\". ` +
      "You cannot undo this action.",
    actionLabel: "Delete product",
    pendingLabel: "Deleting...",
    actionVariant: "destructive" as const,
  }
}
