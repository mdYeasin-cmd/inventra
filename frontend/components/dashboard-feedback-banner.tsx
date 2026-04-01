import { cn } from "@/lib/utils"

type DashboardFeedbackBannerProps = {
  type: "success" | "error"
  message: string
}

function DashboardFeedbackBanner({ type, message }: DashboardFeedbackBannerProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        type === "success"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-destructive/30 bg-destructive/10 text-destructive"
      )}
    >
      {message}
    </div>
  )
}

export { DashboardFeedbackBanner }
