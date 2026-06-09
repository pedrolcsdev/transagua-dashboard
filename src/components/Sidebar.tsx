import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
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
  isDarkMode: boolean
  onToggleTheme: () => void
}

export function Sidebar({
  profile,
  collapsed = false,
  mode = "drawer",
  onNavigate,
  onClose,
  onToggleCollapse,
  isDarkMode,
  onToggleTheme,
}: SidebarProps) {
  const navigation = navigationByProfile[profile]
  const isDesktop = mode === "desktop"
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <div
      className={cn(
        "flex h-full min-h-[32rem] flex-col border border-[var(--border-color)] bg-[var(--sidebar)] text-[var(--sidebar-foreground)] shadow-[0_24px_70px_var(--shadow-color)] transition-all duration-300",
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
              "size-9 shrink-0 rounded-xl text-[var(--text-primary)] hover:bg-[var(--accent-soft)]",
              collapsed && "bg-[var(--bg-elevated)] shadow-[0_8px_18px_var(--shadow-color)]"
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
            className="size-9 rounded-2xl text-[var(--text-primary)] hover:bg-[var(--accent-soft)]"
            onClick={onClose}
            aria-label="Fechar navegação"
          >
            <X data-icon="inline-start" />
          </Button>
        )}
      </div>

      {!collapsed && (
        <div className="mb-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] px-3 py-3 shadow-[0_12px_28px_var(--shadow-color)]">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
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
                  "flex h-12 items-center gap-4 rounded-xl text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--accent-color)] focus-visible:ring-2 focus-visible:ring-[var(--nav-active)] active:translate-y-px",
                  collapsed && isDesktop
                    ? "w-12 justify-center px-0"
                    : "w-full px-3",
                  isActive &&
                    "bg-[var(--nav-active)] text-[var(--accent-contrast)] shadow-[0_12px_30px_rgba(7,153,181,0.22)] hover:bg-[var(--nav-active)] hover:text-[var(--accent-contrast)]"
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
        <button
          type="button"
          role="switch"
          aria-checked={isDarkMode}
          aria-label="Modo escuro"
          title={isDarkMode ? "Modo escuro ativado" : "Modo claro ativado"}
          onClick={onToggleTheme}
          className={cn(
            "flex h-12 items-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] text-sm font-medium text-[var(--text-primary)] shadow-[0_8px_18px_var(--shadow-color)] transition hover:border-[var(--accent-color)] hover:bg-[var(--accent-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]",
            collapsed && isDesktop
              ? "w-12 justify-center px-0"
              : "w-full justify-between gap-3 px-3"
          )}
        >
          {!collapsed && (
            <span className="flex items-center gap-3">
              {isDarkMode ? (
                <Moon className="size-5 stroke-[2.4] text-[var(--accent-color)]" />
              ) : (
                <Sun className="size-5 stroke-[2.4] text-[var(--accent-color)]" />
              )}
              <span>Modo escuro</span>
            </span>
          )}
          {collapsed && isDesktop ? (
            isDarkMode ? (
              <Moon className="size-5 stroke-[2.4] text-[var(--accent-color)]" />
            ) : (
              <Sun className="size-5 stroke-[2.4] text-[var(--accent-color)]" />
            )
          ) : (
            <span
              className={cn(
                "relative h-6 w-11 rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] p-0.5 transition-colors duration-300",
                isDarkMode && "bg-[var(--accent-soft-strong)]"
              )}
              aria-hidden="true"
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full bg-[var(--accent-color)] text-[var(--accent-contrast)] shadow-sm transition-transform duration-300 ease-out",
                  isDarkMode ? "translate-x-5" : "translate-x-0"
                )}
              >
                {isDarkMode ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
              </span>
            </span>
          )}
        </button>

        <Button
          type="button"
          variant="ghost"
          className={cn(
            "h-12 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]",
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
            "h-12 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]",
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
              "mt-1 h-10 rounded-xl text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]",
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
