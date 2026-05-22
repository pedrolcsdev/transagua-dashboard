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
}

const toneClassNames = {
  default: "text-[#102f31]",
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
}: MetricCardProps) {
  return (
    <Card className="rounded-lg border-[#d7e5e5] shadow-[0_12px_36px_rgba(12,55,56,0.06)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          {Icon && <Icon />}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p
          className={cn(
            "text-3xl font-semibold tracking-tight",
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
