"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { AuthService } from "@/services/auth.service"
import { getAccessToken } from "@/services/auth-storage"
import { isApiClientError } from "@/services/http"

type SignupValues = {
  name: string
  email: string
  password: string
}

type SignupErrors = Partial<Record<keyof SignupValues | "form", string>>

const initialValues: SignupValues = {
  name: "",
  email: "",
  password: "",
}

function validateSignup(values: SignupValues) {
  const errors: SignupErrors = {}

  if (!values.name.trim()) {
    errors.name = "Name is required"
  }

  if (!values.email.trim()) {
    errors.email = "Email is required"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Enter a valid email address"
  }

  if (!values.password) {
    errors.password = "Password is required"
  } else if (values.password.length < 6) {
    errors.password = "Password must be at least 6 characters"
  }

  return errors
}

export default function SignupPage() {
  const router = useRouter()
  const [values, setValues] = React.useState(initialValues)
  const [errors, setErrors] = React.useState<SignupErrors>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [successMessage, setSuccessMessage] = React.useState("")

  React.useEffect(() => {
    if (getAccessToken()) {
      router.replace("/dashboard")
    }
  }, [router])

  function updateField(field: keyof SignupValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }))
    setSuccessMessage("")
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validateSignup(values)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const result = await AuthService.signupUser({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      })

      setSuccessMessage(result.message)
      setValues(initialValues)
      window.setTimeout(() => {
        router.push("/login")
      }, 1200)
    } catch (error) {
      if (isApiClientError(error)) {
        const nextFieldErrors: SignupErrors = {
          form: error.message,
        }

        for (const issue of error.errorSources) {
          if (
            issue.path === "name" ||
            issue.path === "email" ||
            issue.path === "password"
          ) {
            nextFieldErrors[issue.path] = issue.message
          }
        }

        setErrors(nextFieldErrors)
      } else {
        setErrors({ form: "Something went wrong. Please try again." })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden px-6 py-16">
      <div className="absolute inset-0 -z-10 bg-background" />
      <div className="absolute top-16 left-1/2 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-8 left-8 -z-10 h-56 w-56 rounded-full bg-muted blur-3xl" />

      <section className="grid w-full max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6 text-center lg:text-left">
          <div className="inline-flex rounded-full border border-border/60 bg-background/80 px-4 py-1.5 text-sm text-muted-foreground shadow-sm backdrop-blur">
            Create your workspace in minutes
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
              Start running inventory and orders with Inventra.
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Set up your account, organize products, and keep purchasing,
              stock, and fulfillment moving through one focused dashboard.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground lg:justify-start">
            <span className="rounded-full border border-border/60 px-3 py-1">
              Live inventory
            </span>
            <span className="rounded-full border border-border/60 px-3 py-1">
              Order tracking
            </span>
            <span className="rounded-full border border-border/60 px-3 py-1">
              Restock visibility
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-border/60 bg-background/85 p-6 shadow-xl backdrop-blur sm:p-8">
          <div className="space-y-2 text-center sm:text-left">
            <p className="text-sm tracking-[0.25em] text-muted-foreground uppercase">
              Inventra account
            </p>
            <h2 className="text-2xl font-semibold">Create your account</h2>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                className="font-medium text-foreground underline underline-offset-4"
                href="/login"
              >
                Login
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={values.name}
                onChange={(event) => updateField("name", event.target.value)}
                aria-invalid={Boolean(errors.name)}
                className="flex h-11 w-full rounded-xl border border-border bg-background px-4 text-sm transition outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
                placeholder="Jane Doe"
              />
              {errors.name ? (
                <p className="text-sm text-destructive">{errors.name}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={(event) => updateField("email", event.target.value)}
                aria-invalid={Boolean(errors.email)}
                className="flex h-11 w-full rounded-xl border border-border bg-background px-4 text-sm transition outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
                placeholder="jane@inventra.app"
              />
              {errors.email ? (
                <p className="text-sm text-destructive">{errors.email}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={values.password}
                onChange={(event) =>
                  updateField("password", event.target.value)
                }
                aria-invalid={Boolean(errors.password)}
                className="flex h-11 w-full rounded-xl border border-border bg-background px-4 text-sm transition outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
                placeholder="At least 6 characters"
              />
              {errors.password ? (
                <p className="text-sm text-destructive">{errors.password}</p>
              ) : null}
            </div>

            {errors.form ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errors.form}
              </div>
            ) : null}

            {successMessage ? (
              <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
                {successMessage} Redirecting to login...
              </div>
            ) : null}

            <Button
              className="h-11 w-full rounded-xl text-sm"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Sign Up"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground sm:text-left">
            By continuing, you are setting up your workspace for inventory,
            stock movement, and order operations.
          </p>
        </div>
      </section>
    </main>
  )
}
