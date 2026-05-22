import { Menu } from "lucide-react"

import { ProfileSelector } from "@/components/ProfileSelector"
import { Button } from "@/components/ui/button"
import type { UserProfile } from "@/lib/profile"

type HeaderProps = {
  pageTitle: string
  profile: UserProfile
  onMenuClick: () => void
  onProfileChange: (profile: UserProfile) => void
}

export function Header({
  pageTitle,
  profile,
  onMenuClick,
  onProfileChange,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-[#dbe8e8] bg-white/90 px-4 shadow-[0_1px_0_rgba(12,55,56,0.04)] backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Abrir navegação"
        >
          <Menu data-icon="inline-start" />
        </Button>

        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[#668284]">
            Operação Transágua
          </p>
          <h1 className="truncate text-lg font-semibold text-[#102f31] sm:text-xl">
            {pageTitle}
          </h1>
        </div>
      </div>

      <ProfileSelector profile={profile} onProfileChange={onProfileChange} />
    </header>
  )
}
