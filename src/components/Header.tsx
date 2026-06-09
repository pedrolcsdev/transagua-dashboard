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
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)]/94 px-3 py-2.5 shadow-[0_14px_40px_-28px_var(--shadow-color)] backdrop-blur-xl sm:px-4">
      <div className="grid w-full grid-cols-[auto_minmax(10rem,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[0_8px_24px_var(--shadow-color)] hover:bg-[var(--accent-soft)] lg:hidden"
            onClick={onMenuClick}
            aria-label="Abrir navegação"
          >
            <Menu data-icon="inline-start" />
          </Button>

          <BrandLogo className="hidden h-9 sm:block lg:hidden" />

          <h1 className="truncate text-base font-semibold tracking-tight text-[var(--text-primary)]">
            {pageTitle}
          </h1>
        </div>

        <label className="relative hidden min-w-0 md:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--accent-color)]" />
          <span className="sr-only">Buscar na plataforma</span>
          <input
            type="search"
            placeholder="Buscar contratos, solicitações ou relatórios"
            className="h-10 w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-11 text-sm text-[var(--text-primary)] shadow-[0_8px_24px_var(--shadow-color)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent-color)] focus:ring-4 focus:ring-[var(--accent-color)]/10"
          />
        </label>

        <div className="flex min-w-0 items-center justify-end gap-2">
          <Button
            type="button"
            className="hidden h-10 rounded-xl bg-[var(--accent-color)] px-4 text-[var(--accent-contrast)] shadow-[0_12px_24px_rgba(8,127,202,0.2)] hover:bg-[var(--accent-hover)] active:translate-y-px sm:inline-flex"
            onClick={handleNewRequest}
          >
            <Plus data-icon="inline-start" />
            Nova solicitação
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden size-10 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[0_8px_24px_var(--shadow-color)] hover:bg-[var(--accent-soft)] lg:inline-flex"
            aria-label="Mensagens"
          >
            <MessageCircle data-icon="inline-start" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden size-10 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[0_8px_24px_var(--shadow-color)] hover:bg-[var(--accent-soft)] sm:inline-flex"
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
