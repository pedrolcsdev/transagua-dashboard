import { Construction } from "lucide-react"

type PagePlaceholderProps = {
  title: string
  description: string
}

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <section className="flex min-h-[calc(100svh-8rem)] items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-sm">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-lg bg-[var(--accent-soft-strong)] text-[var(--accent-color)]">
          <Construction />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{title}</h2>
          <p className="text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
        </div>
      </div>
    </section>
  )
}
