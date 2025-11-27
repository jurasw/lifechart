import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Sidebar } from "@/components/Sidebar"
import { TopBar } from "@/components/TopBar"
import { LoginPage } from "@/components/LoginPage"
import { TasksPage } from "@/pages/TasksPage"
import { WorkoutPage } from "@/pages/WorkoutPage"
import { DietPage } from "@/pages/DietPage"
import { InvestmentPage } from "@/pages/InvestmentPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { useAuthStore } from "@/store/authStore"
import { useState } from "react"

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <TopBar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 lg:ml-64 overflow-y-auto pt-16">
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
