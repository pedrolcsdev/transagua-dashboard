import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react"
import { NavLink } from "react-router-dom"

import { BrandLogo } from "@/components/BrandLogo"
import { Button } from "@/components/ui/button"
import { navigationByProfile } from "@/lib/navigation"
import { getProfileLabel, type UserProfile } from "@/lib/profile"
import { cn } from "@/lib/utils"

type SidebarProps = {
  profile: UserProfile
  collapsed?: boolean
  mode?: "desktop" | "drawer"
  onNavigate?: () => void
  onClose?: () => void
  onToggleCollapse?: () => void
}

export function Sidebar({
  profile,
  collapsed = false,
  mode = "drawer",
  onNavigate,
  onClose,
  onToggleCollapse,
}: SidebarProps) {
  const navigation = navigationByProfile[profile]
  const isDesktop = mode === "desktop"
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <div
      className={cn(
        "flex h-full min-h-[32rem] flex-col border border-white/80 bg-[#f8fafc] text-[#101820] shadow-[0_24px_70px_rgba(15,23,42,0.18)] transition-all duration-300",
        isDesktop ? "rounded-2xl p-2" : "rounded-[1.75rem] p-3",
        collapsed && isDesktop ? "items-center" : ""
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 pb-5",
          collapsed && isDesktop
            ? "min-h-[5.25rem] flex-col justify-center px-0"
            : "justify-between px-1"
        )}
      >
        {!collapsed && <BrandLogo className="h-11" />}
        {collapsed && isDesktop && (
          <BrandLogo className="h-7 max-w-12 object-contain" />
        )}

        {isDesktop ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "size-9 shrink-0 rounded-xl text-[#111] hover:bg-[#edf4f5]",
              collapsed && "bg-white shadow-[0_8px_18px_rgba(15,23,42,0.05)]"
            )}
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expandir navegação" : "Recolher navegação"}
            title={collapsed ? "Expandir" : "Recolher"}
          >
            <ToggleIcon data-icon="inline-start" />
          </Button>
        ) : (
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
        )}
      </div>

      {!collapsed && (
        <div className="mb-5 rounded-2xl border border-[#e5ecef] bg-white px-3 py-3 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6b7475]">
            Perfil ativo
          </p>
          <p className="text-sm font-bold">{getProfileLabel(profile)}</p>
        </div>
      )}

      <nav
        className={cn("flex flex-col gap-2", collapsed && isDesktop && "items-center")}
        aria-label="Navegação principal"
      >
        {navigation.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
              className={({ isActive }) =>
                cn(
                  "flex h-12 items-center gap-4 rounded-xl text-sm font-semibold text-[#46575c] transition hover:bg-white hover:text-[#057f97] focus-visible:ring-2 focus-visible:ring-[#0799b5] active:translate-y-px",
                  collapsed && isDesktop
                    ? "w-12 justify-center px-0"
                    : "w-full px-3",
                  isActive &&
                    "bg-[#0799b5] text-white shadow-[0_12px_30px_rgba(7,153,181,0.22)] hover:bg-[#0799b5] hover:text-white"
                )
              }
            >
              <Icon className="size-5 shrink-0 stroke-[2.4]" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      <div
        className={cn(
          "mt-auto flex flex-col gap-2",
          collapsed && isDesktop && "items-center"
        )}
      >
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "h-12 rounded-xl text-sm font-medium text-[#46575c] hover:bg-white",
            collapsed && isDesktop
              ? "w-12 justify-center px-0"
              : "w-full justify-start gap-4 px-3"
          )}
          title="Notificações"
          aria-label="Notificações"
        >
          <Bell className="size-5 stroke-[2.4]" data-icon="inline-start" />
          {!collapsed && <span>Notificações</span>}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "h-12 rounded-xl text-sm font-medium text-[#46575c] hover:bg-white",
            collapsed && isDesktop
              ? "w-12 justify-center px-0"
              : "w-full justify-start gap-4 px-3"
          )}
          title="Ajuda e informações"
          aria-label="Ajuda e informações"
        >
          <CircleHelp className="size-5 stroke-[2.4]" data-icon="inline-start" />
          {!collapsed && <span>Ajuda e informações</span>}
        </Button>

        {isDesktop && (
          <Button
            type="button"
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            className={cn(
              "mt-1 h-10 rounded-xl text-xs text-[#667b80] hover:bg-white",
              collapsed ? "w-12" : "w-full justify-start gap-2 px-3"
            )}
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expandir navegação" : "Recolher navegação"}
          >
            {collapsed ? (
              <ChevronRight data-icon="inline-start" />
            ) : (
              <>
                <ChevronLeft data-icon="inline-start" />
                Recolher
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
