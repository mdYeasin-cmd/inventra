"use client"

import { Pencil, Plus, Tag, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

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
import {
  type Category,
  CategoryService,
  type CategoryPayload,
} from "@/services/category.service"
import { isApiClientError } from "@/services/http"

type FeedbackState = {
  type: "success" | "error"
  message: string
}

type FormState = {
  name: string
}

type FormErrors = {
  name?: string
  form?: string
}

type ConfirmAction =
  | {
      type: "create"
      payload: CategoryPayload
    }
  | {
      type: "update"
      category: Category
      payload: CategoryPayload
    }
  | {
      type: "delete"
      category: Category
    }

const initialFormState: FormState = {
  name: "",
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

function validateForm(values: FormState) {
  const errors: FormErrors = {}

  if (!values.name.trim()) {
    errors.name = "Category name is required"
  }

  return errors
}

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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [formValues, setFormValues] = useState<FormState>(initialFormState)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [isActionPending, setIsActionPending] = useState(false)

  const loadCategories = useCallback(async () => {
    setIsLoading((current) => current || categories.length === 0)
    setIsRefreshing((current) => current || categories.length > 0)

    try {
      const result = await CategoryService.getAllCategories()
      setCategories(result.data)
      setFeedback(null)
    } catch (error) {
      const details = getErrorDetails(
        error,
        "Unable to load categories right now."
      )

      setFeedback({
        type: "error",
        message: details.message,
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [categories.length])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  function openCreateDialog() {
    setEditingCategory(null)
    setFormValues(initialFormState)
    setFormErrors({})
    setFeedback(null)
    setIsDialogOpen(true)
  }

  function openEditDialog(category: Category) {
    setEditingCategory(category)
    setFormValues({ name: category.name })
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
      setFormErrors({})
      setConfirmAction(null)
    }
  }

  function updateName(value: string) {
    setFormValues((current) => ({
      ...current,
      name: value,
    }))
    setFormErrors((current) => ({
      ...current,
      name: undefined,
      form: undefined,
    }))
  }

  function queueSaveAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors = validateForm(formValues)

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const payload = {
      name: formValues.name.trim(),
    }

    if (editingCategory) {
      setConfirmAction({
        type: "update",
        category: editingCategory,
        payload,
      })
      return
    }

    setConfirmAction({
      type: "create",
      payload,
    })
  }

  function queueDeleteAction(category: Category) {
    setFeedback(null)
    setConfirmAction({
      type: "delete",
      category,
    })
  }

  async function handleConfirmAction() {
    if (!confirmAction) {
      return
    }

    setIsActionPending(true)

    try {
      if (confirmAction.type === "create") {
        const result = await CategoryService.createCategory(confirmAction.payload)

        setCategories((current) => [result.data, ...current])
        setFeedback({
          type: "success",
          message: result.message,
        })
        setIsDialogOpen(false)
        setFormValues(initialFormState)
        setFormErrors({})
      }

      if (confirmAction.type === "update") {
        const result = await CategoryService.updateCategory(
          confirmAction.category._id,
          confirmAction.payload
        )

        setCategories((current) =>
          current.map((category) =>
            category._id === result.data._id ? result.data : category
          )
        )
        setFeedback({
          type: "success",
          message: result.message,
        })
        setIsDialogOpen(false)
        setEditingCategory(null)
        setFormValues(initialFormState)
        setFormErrors({})
      }

      if (confirmAction.type === "delete") {
        const result = await CategoryService.deleteCategory(confirmAction.category._id)

        setCategories((current) =>
          current.filter((category) => category._id !== confirmAction.category._id)
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

  const isEditing = Boolean(editingCategory)
  const confirmationCopy = getConfirmationCopy(confirmAction)

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-background/90 p-6 shadow-sm backdrop-blur sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
              <Tag className="size-3.5" />
              Categories
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Category management
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Create, update, and review product categories from one place.
              </p>
            </div>
          </div>

          <Button
            type="button"
            className="h-10 rounded-xl px-4"
            onClick={openCreateDialog}
          >
            <Plus className="size-4" />
            Add Category
          </Button>
        </div>

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

        <section className="overflow-hidden rounded-3xl border border-border/60 bg-background shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Category list</h2>
              <p className="text-sm text-muted-foreground">
                {isRefreshing
                  ? "Refreshing categories..."
                  : `${categories.length} categor${categories.length === 1 ? "y" : "ies"} available`}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={isRefreshing}
              onClick={() => void loadCategories()}
            >
              Refresh
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                    Loading categories...
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                    No categories found. Add your first category to get started.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category._id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{category.name}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(category.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(category.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => openEditDialog(category)}
                        >
                          <Pencil className="size-4" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          className="rounded-xl"
                          onClick={() => queueDeleteAction(category)}
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
        </section>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit category" : "Add category"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the category name, then confirm the change before saving it."
                : "Enter a category name, then confirm before creating it."}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={queueSaveAction}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="category-name">
                Category name
              </label>
              <Input
                id="category-name"
                name="name"
                placeholder="Electronics"
                value={formValues.name}
                onChange={(event) => updateName(event.target.value)}
                aria-invalid={Boolean(formErrors.name)}
                disabled={isActionPending}
              />
              {formErrors.name ? (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              ) : null}
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
              <Button type="submit" className="rounded-xl" disabled={isActionPending}>
                {isEditing ? "Review update" : "Review create"}
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
            <AlertDialogDescription>
              {confirmationCopy.description}
            </AlertDialogDescription>
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

  if (confirmAction.type === "create") {
    return {
      title: "Create category?",
      description: `This will create the category \"${confirmAction.payload.name}\".`,
      actionLabel: "Create category",
      pendingLabel: "Creating...",
      actionVariant: "default" as const,
    }
  }

  if (confirmAction.type === "update") {
    return {
      title: "Update category?",
      description: `This will rename \"${confirmAction.category.name}\" to \"${confirmAction.payload.name}\".`,
      actionLabel: "Save changes",
      pendingLabel: "Saving...",
      actionVariant: "default" as const,
    }
  }

  return {
    title: "Delete category?",
    description:
      `This will delete \"${confirmAction.category.name}\". ` +
      "You cannot undo this action.",
    actionLabel: "Delete category",
    pendingLabel: "Deleting...",
    actionVariant: "destructive" as const,
  }
}
