type DashboardStatCardProps = {
  label: string
  value: string | number
  description?: string
}

function DashboardStatCard({ label, value, description }: DashboardStatCardProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background px-4 py-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  )
}

export { DashboardStatCard }
