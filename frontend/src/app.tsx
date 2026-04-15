import { BrowserRouter, Route, Routes } from "react-router"
import { Toaster } from "sonner"

import { AuthGuard } from "@/components/auth-guard"
import { AuthProvider } from "@/hooks/auth-provider"
import { HomePage } from "@/pages/home"
import { LoginPage } from "@/pages/login"

export function App() {
  return (
    <AuthProvider>
      <Toaster
        position="bottom-center"
        toastOptions={{ className: "text-sm" }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <AuthGuard>
                <HomePage />
              </AuthGuard>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
