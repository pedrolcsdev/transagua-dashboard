import type { LucideIcon } from "lucide-react"
import { LoaderCircle } from "lucide-react"

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 p-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-lg bg-background text-muted-foreground">
        <Icon />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

export function LoadingState({ label = "Carregando dados" }: { label?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-lg border bg-muted/20 p-6 text-sm text-muted-foreground">
      <LoaderCircle className="mr-2 animate-spin" />
      {label}
    </div>
  )
}
