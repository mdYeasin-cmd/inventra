"use client"

import { usePathname } from "next/navigation"

import { ThemeToggle } from "@/components/theme-toggle"

function AppThemeToggle() {
  const pathname = usePathname()

  if (pathname.startsWith("/dashboard")) {
    return null
  }

  return <ThemeToggle className="fixed top-4 right-4 z-50" />
}

export { AppThemeToggle }
