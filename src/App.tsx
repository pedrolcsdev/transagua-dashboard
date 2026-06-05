import { useEffect, useMemo, useState } from "react"
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom"

import { AppShell } from "@/layout/AppShell"
import { navigationByProfile } from "@/lib/navigation"
import {
  DEFAULT_USER_ID,
  getStoredUser,
  getStoredProfile,
  PROFILE_STORAGE_KEY,
  USER_STORAGE_KEY,
  getUsersByProfile,
  type AppUser,
} from "@/lib/profile"
import { Contratos } from "@/pages/Contratos"
import { Dashboard } from "@/pages/Dashboard"
import { LancamentoDiario } from "@/pages/LancamentoDiario"
import { Relatorios } from "@/pages/Relatorios"
import { Revisao } from "@/pages/Revisao"
import { Solicitacoes } from "@/pages/Solicitacoes"
import { Usuarios } from "@/pages/Usuarios"

function ShellRoutes() {
  const [user, setUser] = useState<AppUser>(() => getStoredUser())
  const navigate = useNavigate()
  const location = useLocation()
  const profile = user.profile

  const allowedPaths = useMemo(
    () => navigationByProfile[profile].map((item) => item.path),
    [profile]
  )

  useEffect(() => {
    localStorage.setItem(USER_STORAGE_KEY, user.id)
    localStorage.setItem(PROFILE_STORAGE_KEY, user.profile)
  }, [user])

  useEffect(() => {
    if (!allowedPaths.includes(location.pathname)) {
      navigate(allowedPaths[0] ?? "/dashboard", { replace: true })
    }
  }, [allowedPaths, location.pathname, navigate])

  return (
    <Routes>
      <Route
        element={<AppShell user={user} profile={profile} onUserChange={setUser} />}
      >
        <Route
          index
          element={
            <Navigate
              to={navigationByProfile[profile][0]?.path ?? "/dashboard"}
              replace
            />
          }
        />
        <Route
          path="/dashboard"
          element={<Dashboard key={user.id} currentUser={user} />}
        />
        <Route
          path="/contratos"
          element={<Contratos key={user.id} currentUser={user} />}
        />
        <Route
          path="/solicitacoes"
          element={<Solicitacoes key={user.id} currentUser={user} />}
        />
        <Route path="/abastecimento" element={<Navigate to="/solicitacoes" replace />} />
        <Route
          path="/lancamento-diario"
          element={<LancamentoDiario key={user.id} currentUser={user} />}
        />
        <Route
          path="/revisao"
          element={<Revisao key={user.id} currentUser={user} />}
        />
        <Route
          path="/relatorios"
          element={<Relatorios key={user.id} currentUser={user} />}
        />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route
          path="*"
          element={
            <Navigate
              to={navigationByProfile[profile][0]?.path ?? "/dashboard"}
              replace
            />
          }
        />
      </Route>
    </Routes>
  )
}

function App() {
  useEffect(() => {
    if (!localStorage.getItem(USER_STORAGE_KEY)) {
      const legacyProfile = getStoredProfile()
      const defaultUser = getUsersByProfile(legacyProfile)[0]
      localStorage.setItem(USER_STORAGE_KEY, defaultUser?.id ?? DEFAULT_USER_ID)
    }
  }, [])

  return (
    <BrowserRouter>
      <ShellRoutes />
    </BrowserRouter>
  )
}

export default App
