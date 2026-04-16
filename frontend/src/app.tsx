import { BrowserRouter, Route, Routes } from "react-router"
import { Toaster } from "sonner"

import { AuthGuard } from "@/components/auth-guard"
import { OfflineIndicator } from "@/components/offline-indicator"
import { AuthProvider } from "@/hooks/auth-provider"
import { HomePage } from "@/pages/home"
import { LoginPage } from "@/pages/login"

export function App() {
  return (
    <AuthProvider>
      <OfflineIndicator />
      <Toaster
        position="bottom-center"
        toastOptions={{
          className: "text-sm",
          duration: 3000,
          style: {
            fontFamily: "var(--font-sans)",
            borderRadius: "var(--radius)",
            boxShadow: "var(--shadow-elevated)",
          },
        }}
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
