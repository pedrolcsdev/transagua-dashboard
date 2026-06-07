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
    <Card className="rounded-[1.7rem] border-[#dfe8ea] bg-white shadow-[0_20px_45px_-28px_rgba(15,23,42,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_55px_-30px_rgba(15,23,42,0.35)]">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-3 text-sm">
          {Icon && (
            <span className="flex size-10 items-center justify-center rounded-2xl bg-[#eef7f8] text-[#087fca]">
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
            "font-mono text-3xl font-semibold tracking-tight",
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
