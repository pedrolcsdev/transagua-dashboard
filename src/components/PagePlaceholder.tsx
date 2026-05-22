import { Construction } from "lucide-react"

type PagePlaceholderProps = {
  title: string
  description: string
}

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <section className="flex min-h-[calc(100svh-8rem)] items-center justify-center rounded-lg border border-[#dbe8e8] bg-white p-6 shadow-sm">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-lg bg-[#e7f8f5] text-[#116468]">
          <Construction />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-[#102f31]">{title}</h2>
          <p className="text-sm leading-6 text-[#627c7f]">{description}</p>
        </div>
      </div>
    </section>
  )
}
