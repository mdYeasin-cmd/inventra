"use client"

import { useDashboardSession } from "@/components/dashboard-shell"

export default function DashboardPage() {
  const session = useDashboardSession()

  console.log(session, "user session")

  return (
    <div className="space-y-6 lg:space-y-8">
      <h1>Dashbaord Page</h1>
    </div>
  )
}
