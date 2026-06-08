import { Bell, Menu, MessageCircle, Plus, Search } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { BrandLogo } from "@/components/BrandLogo"
import { ProfileSelector } from "@/components/ProfileSelector"
import { Button } from "@/components/ui/button"
import { navigationByProfile } from "@/lib/navigation"
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
  const navigate = useNavigate()
  const firstAllowedPath = navigationByProfile[user.profile][0]?.path ?? "/dashboard"
  const canOpenRequests = navigationByProfile[user.profile].some(
    (item) => item.path === "/solicitacoes"
  )

  function handleNewRequest() {
    navigate(canOpenRequests ? "/solicitacoes" : firstAllowedPath)
  }

  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-5">
      <div className="rounded-2xl border border-[#dbe8e8]/80 bg-[#f6f8fb]/94 px-3 py-2.5 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:px-4">
      <div className="grid w-full grid-cols-[auto_minmax(10rem,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 rounded-xl border border-[#dfe8ea] bg-white text-[#102f31] shadow-[0_8px_24px_rgba(15,23,42,0.05)] hover:bg-[#eef7f6] lg:hidden"
            onClick={onMenuClick}
            aria-label="Abrir navegação"
          >
            <Menu data-icon="inline-start" />
          </Button>

          <BrandLogo className="hidden h-9 sm:block lg:hidden" />

          <h1 className="truncate text-base font-semibold tracking-tight text-[#102f31]">
            {pageTitle}
          </h1>
        </div>

        <label className="relative hidden min-w-0 md:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#4d8ea0]" />
          <span className="sr-only">Buscar na plataforma</span>
          <input
            type="search"
            placeholder="Buscar contratos, solicitações ou relatórios"
            className="h-10 w-full rounded-xl border border-[#dfe8ea] bg-white px-11 text-sm text-[#102f31] shadow-[0_8px_24px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-[#8ba2a6] focus:border-[#0799b5] focus:ring-4 focus:ring-[#0799b5]/10"
          />
        </label>

        <div className="flex min-w-0 items-center justify-end gap-2">
          <Button
            type="button"
            className="hidden h-10 rounded-xl bg-[#087fca] px-4 text-white shadow-[0_12px_24px_rgba(8,127,202,0.2)] hover:bg-[#056ea9] active:translate-y-px sm:inline-flex"
            onClick={handleNewRequest}
          >
            <Plus data-icon="inline-start" />
            Nova solicitação
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden size-10 rounded-xl border border-[#dfe8ea] bg-white text-[#102f31] shadow-[0_8px_24px_rgba(15,23,42,0.04)] hover:bg-[#eef7f6] lg:inline-flex"
            aria-label="Mensagens"
          >
            <MessageCircle data-icon="inline-start" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden size-10 rounded-xl border border-[#dfe8ea] bg-white text-[#102f31] shadow-[0_8px_24px_rgba(15,23,42,0.04)] hover:bg-[#eef7f6] sm:inline-flex"
            aria-label="Notificações"
          >
            <Bell data-icon="inline-start" />
          </Button>

          <ProfileSelector user={user} onUserChange={onUserChange} />
        </div>
      </div>
      </div>
    </header>
  )
}
