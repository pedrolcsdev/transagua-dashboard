import { Outlet, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"

import { Header } from "@/components/Header"
import { Sidebar } from "@/components/Sidebar"
import { getPageTitle } from "@/lib/navigation"
import type { AppUser, UserProfile } from "@/lib/profile"
import { cn } from "@/lib/utils"

const THEME_STORAGE_KEY = "transagua-theme"
type ThemeMode = "light" | "dark"

type AppShellProps = {
  user: AppUser
  profile: UserProfile
  onUserChange: (user: AppUser) => void
  onLogout: () => void
}

export function AppShell({ user, profile, onUserChange, onLogout }: AppShellProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light"
  })
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)
  const isDarkMode = themeMode === "dark"

  useEffect(() => {
    // The html class lets every component consume the same CSS variable theme.
    document.documentElement.classList.toggle("dark-mode", isDarkMode)
    document.documentElement.classList.toggle("dark", isDarkMode)
    localStorage.setItem(THEME_STORAGE_KEY, themeMode)
  }, [isDarkMode, themeMode])

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileSidebarOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isMobileSidebarOpen])

  return (
    <div className="min-h-svh bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <a
        href="#app-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        Ir para o conteúdo
      </a>
      <div className="flex min-h-svh">
        <aside
          className={cn(
            "sticky top-0 hidden h-svh shrink-0 p-3 pr-0 transition-[width] duration-300 ease-out lg:block",
            isSidebarCollapsed ? "w-[5.75rem]" : "w-[17.5rem]"
          )}
        >
          <Sidebar
            profile={profile}
            collapsed={isSidebarCollapsed}
            mode="desktop"
            isDarkMode={isDarkMode}
            onToggleTheme={() =>
              setThemeMode((currentMode) =>
                currentMode === "dark" ? "light" : "dark"
              )
            }
            onToggleCollapse={() =>
              setIsSidebarCollapsed((currentValue) => !currentValue)
            }
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            pageTitle={pageTitle}
            user={user}
            onMenuClick={() => setIsMobileSidebarOpen(true)}
            onUserChange={onUserChange}
            onLogout={onLogout}
          />

          <main
            id="app-content"
            className="flex-1 scroll-mt-24 px-3 py-4 sm:px-5 lg:px-6 lg:py-5"
          >
            <div className="mx-auto w-full max-w-[96rem]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 ease-out lg:hidden",
          isMobileSidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none"
        )}
        aria-hidden={!isMobileSidebarOpen}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[min(19rem,calc(100vw-2rem))] p-3 transition-transform duration-300 ease-out will-change-transform lg:hidden",
          isMobileSidebarOpen
            ? "pointer-events-auto translate-x-0"
            : "pointer-events-none -translate-x-full"
        )}
        aria-hidden={!isMobileSidebarOpen}
      >
        <Sidebar
          profile={profile}
          mode="drawer"
          isDarkMode={isDarkMode}
          onToggleTheme={() =>
            setThemeMode((currentMode) =>
              currentMode === "dark" ? "light" : "dark"
            )
          }
          onNavigate={() => setIsMobileSidebarOpen(false)}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
      </aside>
    </div>
  )
}
