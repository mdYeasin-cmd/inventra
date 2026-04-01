import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden px-6 py-16">
      <div className="absolute inset-0 -z-10 bg-background" />
      <div className="absolute top-24 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute right-10 bottom-10 -z-10 h-48 w-48 rounded-full bg-muted blur-3xl" />

      <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 text-center">
        <div className="space-y-6">
          <div className="inline-flex items-center rounded-full border border-border/60 bg-background/80 px-4 py-1.5 text-sm text-muted-foreground shadow-sm backdrop-blur">
            Inventory and order management
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-7xl md:text-8xl">
              Inventra
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Organize inventory, track product orders, and keep every moving
              part in sync from one focused workspace.
            </p>
          </div>
        </div>

        <div className="flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/signup">Sign Up</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
