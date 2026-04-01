import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

type DashboardPageHeaderProps = {
  icon: LucideIcon
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
}

function DashboardPageHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  actions,
}: DashboardPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-background/90 p-6 shadow-sm backdrop-blur sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
          <Icon className="size-3.5" />
          {eyebrow}
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
      </div>

      {actions ? <div className="flex flex-col gap-2">{actions}</div> : null}
    </div>
  )
}

export { DashboardPageHeader }
