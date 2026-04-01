"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { AuthService } from "@/services/auth.service"
import { getAccessToken, setAuthTokens } from "@/services/auth-storage"
import { isApiClientError } from "@/services/http"

type LoginValues = {
  email: string
  password: string
}

type LoginErrors = Partial<Record<keyof LoginValues | "form", string>>

const initialValues: LoginValues = {
  email: "",
  password: "",
}

function validateLogin(values: LoginValues) {
  const errors: LoginErrors = {}

  if (!values.email.trim()) {
    errors.email = "Email is required"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Enter a valid email address"
  }

  if (!values.password) {
    errors.password = "Password is required"
  }

  return errors
}

export default function LoginPage() {
  const router = useRouter()
  const [values, setValues] = React.useState(initialValues)
  const [errors, setErrors] = React.useState<LoginErrors>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (getAccessToken()) {
      router.replace("/dashboard")
    }
  }, [router])

  function updateField(field: keyof LoginValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validateLogin(values)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const result = await AuthService.loginUser({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      })

      setAuthTokens(result.data.accessToken, result.data.refreshToken)
      router.push("/dashboard")
    } catch (error) {
      if (isApiClientError(error)) {
        setErrors({ form: error.message })
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
      <div className="absolute top-10 right-10 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-10 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-muted blur-3xl" />

      <section className="grid w-full max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="order-2 rounded-3xl border border-border/60 bg-background/85 p-6 shadow-xl backdrop-blur sm:p-8 lg:order-1">
          <div className="space-y-2 text-center sm:text-left">
            <p className="text-sm tracking-[0.25em] text-muted-foreground uppercase">
              Welcome back
            </p>
            <h1 className="text-2xl font-semibold">Login to Inventra</h1>
            <p className="text-sm text-muted-foreground">
              New here?{" "}
              <Link
                className="font-medium text-foreground underline underline-offset-4"
                href="/signup"
              >
                Create an account
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
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
                autoComplete="current-password"
                value={values.password}
                onChange={(event) =>
                  updateField("password", event.target.value)
                }
                aria-invalid={Boolean(errors.password)}
                className="flex h-11 w-full rounded-xl border border-border bg-background px-4 text-sm transition outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
                placeholder="Enter your password"
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

            <Button
              className="h-11 w-full rounded-xl text-sm"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Login"}
            </Button>
          </form>
        </div>

        <div className="order-1 space-y-6 text-center lg:order-2 lg:text-left">
          <div className="inline-flex rounded-full border border-border/60 bg-background/80 px-4 py-1.5 text-sm text-muted-foreground shadow-sm backdrop-blur">
            Inventory visibility, without the noise
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-semibold tracking-tight sm:text-6xl">
              Step back into your operation command center.
            </h2>
            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8 lg:ml-0">
              Review inventory movement, coordinate orders, and keep your team
              aligned from a single, focused workspace built for execution.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-left shadow-sm backdrop-blur">
              <p className="text-sm text-muted-foreground">Stock health</p>
              <p className="mt-2 text-lg font-semibold">Realtime updates</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-left shadow-sm backdrop-blur">
              <p className="text-sm text-muted-foreground">Order flow</p>
              <p className="mt-2 text-lg font-semibold">Clear tracking</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-left shadow-sm backdrop-blur">
              <p className="text-sm text-muted-foreground">Restock queue</p>
              <p className="mt-2 text-lg font-semibold">Actionable signals</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
