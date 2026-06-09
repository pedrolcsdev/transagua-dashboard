import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type MetricCardProps = {
  title: string
  description: string
  value: ReactNode
  icon?: LucideIcon
  tone?: "default" | "positive" | "warning" | "danger"
  children?: ReactNode
  className?: string
}

const toneClassNames = {
  default: "text-[var(--text-primary)]",
  positive: "text-emerald-700",
  warning: "text-amber-700",
  danger: "text-red-700",
}

export function MetricCard({
  title,
  description,
  value,
  icon: Icon,
  tone = "default",
  children,
  className,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "rounded-2xl border-[var(--border-color)] bg-[var(--card-bg)] shadow-[0_14px_34px_-26px_rgba(15,23,42,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_-28px_rgba(15,23,42,0.34)]",
        className
      )}
    >
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-3 text-sm">
          {Icon && (
            <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-color)]">
              <Icon className="size-5" />
            </span>
          )}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p
          className={cn(
            "font-mono text-3xl font-semibold leading-none tracking-tight",
            toneClassNames[tone]
          )}
        >
          {value}
        </p>
        {children}
      </CardContent>
    </Card>
  )
}
