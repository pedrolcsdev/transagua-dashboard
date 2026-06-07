import { Bell, CircleHelp, X } from "lucide-react"
import { NavLink } from "react-router-dom"

import { BrandLogo } from "@/components/BrandLogo"
import { Button } from "@/components/ui/button"
import { navigationByProfile } from "@/lib/navigation"
import { getProfileLabel, type UserProfile } from "@/lib/profile"
import { cn } from "@/lib/utils"

type SidebarProps = {
  profile: UserProfile
  onNavigate?: () => void
  onClose?: () => void
}

export function Sidebar({ profile, onNavigate, onClose }: SidebarProps) {
  const navigation = navigationByProfile[profile]

  return (
    <div className="flex h-full min-h-[32rem] flex-col rounded-[1.75rem] border border-white/80 bg-[#f8fafc] p-3 text-[#101820] shadow-[0_24px_70px_rgba(15,23,42,0.24)]">
      <div className="flex items-center justify-between gap-3 px-1 pb-6">
        <BrandLogo className="h-11" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 rounded-2xl text-[#111] hover:bg-[#edf4f5]"
          onClick={onClose}
          aria-label="Fechar navegação"
        >
          <X data-icon="inline-start" />
        </Button>
      </div>

      <div className="mb-5 rounded-3xl border border-[#e5ecef] bg-white px-3 py-3 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
        <p className="text-xs font-medium uppercase tracking-wide text-[#6b7475]">
          Perfil ativo
        </p>
        <p className="text-sm font-bold">{getProfileLabel(profile)}</p>
      </div>

      <nav className="flex flex-col gap-2" aria-label="Navegação principal">
        {navigation.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex h-12 items-center gap-4 rounded-2xl px-3 text-sm font-semibold text-[#46575c] transition hover:bg-white hover:text-[#057f97] focus-visible:ring-2 focus-visible:ring-[#0799b5] active:translate-y-px",
                  isActive &&
                    "bg-[#0799b5] text-white shadow-[0_12px_30px_rgba(7,153,181,0.22)] hover:bg-[#0799b5] hover:text-white"
                )
              }
            >
              <Icon className="size-5 shrink-0 stroke-[2.4]" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        <Button
          type="button"
          variant="ghost"
          className="h-12 w-full justify-start gap-4 rounded-2xl px-3 text-sm font-medium text-[#46575c] hover:bg-white"
        >
          <Bell className="size-5 stroke-[2.4]" data-icon="inline-start" />
          <span>Notificações</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-12 w-full justify-start gap-4 rounded-2xl px-3 text-sm font-medium text-[#46575c] hover:bg-white"
        >
          <CircleHelp className="size-5 stroke-[2.4]" data-icon="inline-start" />
          <span>Ajuda e informações</span>
        </Button>
      </div>
    </div>
  )
}
