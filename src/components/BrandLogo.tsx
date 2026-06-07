import { cn } from "@/lib/utils"

const transaguaLogoUrl = new URL("../../imagens/image 3.png", import.meta.url).href

type BrandLogoProps = {
  className?: string
}

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <img
      src={transaguaLogoUrl}
      alt="Transágua"
      className={cn("h-11 w-auto object-contain", className)}
    />
  )
}
