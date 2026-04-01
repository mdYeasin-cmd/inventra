"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const isDark = resolvedTheme === "dark"
  const nextTheme = isDark ? "light" : "dark"
  const label = isDark ? "Light mode" : "Dark mode"

  return (
    <Button
      type="button"
      variant="outline"
      className="fixed top-4 right-4 z-50 h-10 gap-2 rounded-full border-border/60 bg-background/80 px-4 shadow-sm backdrop-blur"
      onClick={() => setTheme(nextTheme)}
      aria-label={`Switch to ${label.toLowerCase()}`}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      <span>{label}</span>
    </Button>
  )
}

export { ThemeToggle }
