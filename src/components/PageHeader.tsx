import type { ReactNode } from "react"

type PageHeaderProps = {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <section className="grid gap-4 rounded-[2rem] border border-[#dfe8ea] bg-white px-5 py-5 shadow-[0_20px_45px_-24px_rgba(15,23,42,0.22)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:px-7">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#087fca]">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#102f31] sm:text-3xl">
          {title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667b80]">
          {description}
        </p>
      </div>
      {actions && <div className="min-w-0">{actions}</div>}
    </section>
  )
}
