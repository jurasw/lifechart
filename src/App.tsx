import { useState } from "react"
import { Sidebar } from "@/components/Sidebar"
import { TasksPage } from "@/pages/TasksPage"
import { WorkoutPage } from "@/pages/WorkoutPage"
import { DietPage } from "@/pages/DietPage"
import { InvestmentPage } from "@/pages/InvestmentPage"
import { SettingsPage } from "@/pages/SettingsPage"

function App() {
  const [currentPage, setCurrentPage] = useState("tasks")
  const renderPage = () => {
    switch (currentPage) {
      case "tasks":
        return <TasksPage />
      case "workout":
        return <WorkoutPage />
      case "diet":
        return <DietPage />
      case "investment":
        return <InvestmentPage />
      case "settings":
        return <SettingsPage />
      default:
        return <TasksPage />
    }
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="flex-1 ml-64 overflow-y-auto">
        {renderPage()}
      </div>
    </div>
  )
}

export default App
