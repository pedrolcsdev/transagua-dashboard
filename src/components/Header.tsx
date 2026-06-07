import { Bell, Menu, MessageCircle, Plus, Search } from "lucide-react"

import { BrandLogo } from "@/components/BrandLogo"
import { ProfileSelector } from "@/components/ProfileSelector"
import { Button } from "@/components/ui/button"
import type { AppUser } from "@/lib/profile"

type HeaderProps = {
  pageTitle: string
  user: AppUser
  onMenuClick: () => void
  onUserChange: (user: AppUser) => void
}

export function Header({
  pageTitle,
  user,
  onMenuClick,
  onUserChange,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#dbe8e8]/70 bg-[#f6f8fb]/88 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1480px] grid-cols-[auto_1fr_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 rounded-2xl border border-[#dfe8ea] bg-white text-[#102f31] shadow-[0_10px_30px_rgba(15,23,42,0.06)] hover:bg-[#eef7f6]"
            onClick={onMenuClick}
            aria-label="Abrir navegação"
          >
            <Menu data-icon="inline-start" />
          </Button>

          <BrandLogo className="hidden h-10 sm:block" />

          <div className="hidden min-w-0 xl:block">
            <p className="text-xs font-medium uppercase tracking-wide text-[#668284]">
              Operação Transágua
            </p>
            <h1 className="truncate text-lg font-semibold text-[#102f31] sm:text-xl">
              {pageTitle}
            </h1>
          </div>
        </div>

        <label className="relative hidden min-w-0 md:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#4d8ea0]" />
          <span className="sr-only">Buscar na plataforma</span>
          <input
            type="search"
            placeholder="Buscar contratos, solicitações ou relatórios"
            className="h-11 w-full rounded-2xl border border-[#dfe8ea] bg-white px-11 text-sm text-[#102f31] shadow-[0_10px_30px_rgba(15,23,42,0.05)] outline-none transition placeholder:text-[#8ba2a6] focus:border-[#0799b5] focus:ring-4 focus:ring-[#0799b5]/10"
          />
        </label>

        <div className="flex min-w-0 items-center justify-end gap-2">
          <Button
            type="button"
            className="hidden h-11 rounded-2xl bg-[#087fca] px-4 text-white shadow-[0_14px_30px_rgba(8,127,202,0.22)] hover:bg-[#056ea9] active:translate-y-px sm:inline-flex"
          >
            <Plus data-icon="inline-start" />
            Nova solicitação
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden size-11 rounded-2xl border border-[#dfe8ea] bg-white text-[#102f31] shadow-[0_10px_30px_rgba(15,23,42,0.05)] hover:bg-[#eef7f6] lg:inline-flex"
            aria-label="Mensagens"
          >
            <MessageCircle data-icon="inline-start" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden size-11 rounded-2xl border border-[#dfe8ea] bg-white text-[#102f31] shadow-[0_10px_30px_rgba(15,23,42,0.05)] hover:bg-[#eef7f6] sm:inline-flex"
            aria-label="Notificações"
          >
            <Bell data-icon="inline-start" />
          </Button>

          <ProfileSelector user={user} onUserChange={onUserChange} />
        </div>
      </div>
    </header>
  )
}
