import { Bell, LogOut, Menu, MessageCircle, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { BrandLogo } from "@/components/BrandLogo"
import { ProfileSelector } from "@/components/ProfileSelector"
import { Button } from "@/components/ui/button"
import type { AppUser } from "@/lib/profile"

type HeaderProps = {
  pageTitle: string
  user: AppUser
  onMenuClick: () => void
  onUserChange: (user: AppUser) => void
  onLogout: () => void
}

export function Header({
  pageTitle,
  user,
  onMenuClick,
  onUserChange,
  onLogout,
}: HeaderProps) {
  const navigate = useNavigate()
  const canCreateRequestFromHeader = user.profile === "leader"

  function handleNewRequest() {
    navigate("/solicitacoes")
  }

  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-5">
      <div className="mx-auto max-w-[96rem] rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)]/94 px-3 py-2.5 shadow-[0_14px_40px_-28px_var(--shadow-color)] backdrop-blur-xl sm:px-4">
      <div className="grid w-full grid-cols-[minmax(8rem,1fr)_auto] items-center gap-3">
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

          <p className="truncate text-base font-semibold tracking-tight text-[var(--text-primary)]">
            {pageTitle}
          </p>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2">
          {canCreateRequestFromHeader && (
            <Button
              type="button"
              className="hidden h-10 rounded-xl bg-[var(--accent-color)] px-4 text-[var(--accent-contrast)] shadow-[0_12px_24px_rgba(8,127,202,0.2)] hover:bg-[var(--accent-hover)] active:translate-y-px sm:inline-flex"
              onClick={handleNewRequest}
            >
              <Plus data-icon="inline-start" />
              Nova solicitação
            </Button>
          )}

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

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[0_8px_24px_var(--shadow-color)] hover:bg-[var(--accent-soft)]"
            onClick={onLogout}
            aria-label="Sair"
          >
            <LogOut data-icon="inline-start" />
          </Button>
        </div>
      </div>
      </div>
    </header>
  )
}
