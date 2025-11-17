import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Sidebar } from "@/components/Sidebar"
import { TasksPage } from "@/pages/TasksPage"
import { WorkoutPage } from "@/pages/WorkoutPage"
import { DietPage } from "@/pages/DietPage"
import { InvestmentPage } from "@/pages/InvestmentPage"
import { SettingsPage } from "@/pages/SettingsPage"

function App() {
  return (
    <BrowserRouter>
      <div className="h-screen bg-background flex overflow-hidden">
        <Sidebar />
        <div className="flex-1 ml-64 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/tasks" replace />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/workout" element={<WorkoutPage />} />
            <Route path="/diet" element={<DietPage />} />
            <Route path="/investment" element={<InvestmentPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
