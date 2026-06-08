import { Outlet, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"

import { Header } from "@/components/Header"
import { Sidebar } from "@/components/Sidebar"
import { getPageTitle } from "@/lib/navigation"
import type { AppUser, UserProfile } from "@/lib/profile"
import { cn } from "@/lib/utils"

type AppShellProps = {
  user: AppUser
  profile: UserProfile
  onUserChange: (user: AppUser) => void
}

export function AppShell({ user, profile, onUserChange }: AppShellProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)

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
    <div className="min-h-svh bg-[#f6f8fb] text-[#172426]">
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
          />

          <main className="flex-1 px-3 py-4 sm:px-5 lg:px-6 lg:py-5">
            <div className="w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-[#111827]/45 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 ease-out lg:hidden",
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
          onNavigate={() => setIsMobileSidebarOpen(false)}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
      </aside>
    </div>
  )
}
