import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Sidebar } from "@/components/Sidebar"
import { LoginPage } from "@/components/LoginPage"
import { TasksPage } from "@/pages/TasksPage"
import { WorkoutPage } from "@/pages/WorkoutPage"
import { DietPage } from "@/pages/DietPage"
import { InvestmentPage } from "@/pages/InvestmentPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { useAuthStore } from "@/store/authStore"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthStore()

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return <>{children}</>
}

function AppContent() {
  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 ml-64 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/tasks" replace />} />
          <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
          <Route path="/workout" element={<ProtectedRoute><WorkoutPage /></ProtectedRoute>} />
          <Route path="/diet" element={<ProtectedRoute><DietPage /></ProtectedRoute>} />
          <Route path="/investment" element={<ProtectedRoute><InvestmentPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
