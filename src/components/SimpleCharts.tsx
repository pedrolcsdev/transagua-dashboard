import { cn } from "@/lib/utils"

type BarChartItem = {
  label: string
  value: number
  helper?: string
}

type DonutChartItem = {
  label: string
  value: number
  colorClassName: string
}

export function MetricBar({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  const width = Math.max(0, Math.min(value, 100))

  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full bg-[var(--accent-color)]", className)}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

export function HorizontalBarChart({ items }: { items: BarChartItem[] }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1)

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => {
        const width = (item.value / maxValue) * 100

        return (
          <div key={item.label} className="grid gap-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium">{item.label}</span>
              <span className="text-muted-foreground">{item.helper}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[var(--accent-color)]"
                style={{ width: `${Math.max(width, 4)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function DonutLegend({ items }: { items: DonutChartItem[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => {
        const percentage = total > 0 ? (item.value / total) * 100 : 0

        return (
          <div key={item.label} className="rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <span className={cn("size-2 rounded-full", item.colorClassName)} />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold">{item.value}</p>
            <p className="text-xs text-muted-foreground">
              {percentage.toFixed(0)}% dos itens filtrados
            </p>
          </div>
        )
      })}
    </div>
  )
}
