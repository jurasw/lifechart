import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { Download, Upload, Trash2 } from "lucide-react"
import { useTasks } from "@/hooks/useTasks"
import { useInvestments } from "@/hooks/useInvestments"
import { useDiet } from "@/hooks/useDiet"

export const SettingsPage = () => {
  const { setTasks, setSelectedTaskId, setEditingTaskId } = useTasks()
  const { setInvestments } = useInvestments()
  const { setDishes } = useDiet()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const [importData, setImportData] = useState<any>(null)
  const [importCounts, setImportCounts] = useState({ tasks: 0, investments: 0, dishes: 0 })

  const handleExport = () => {
    const allData: Record<string, any> = {}
    
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      try {
        const value = localStorage.getItem(key)
        if (value) {
          allData[key] = JSON.parse(value)
        }
      } catch (error) {
      }
    })

    const data = {
      ...allData,
      exportedAt: new Date().toISOString(),
      version: "1.0.0",
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `lifechart-export-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        
        const counts = {
          tasks: (data.tasks && Array.isArray(data.tasks)) ? data.tasks.length : 
                  (data["tasks"] && Array.isArray(data["tasks"])) ? data["tasks"].length : 0,
          investments: (data.investments && Array.isArray(data.investments)) ? data.investments.length :
                      (data["investments"] && Array.isArray(data["investments"])) ? data["investments"].length : 0,
          dishes: (data.diet_dishes && Array.isArray(data.diet_dishes)) ? data.diet_dishes.length :
                  (data["diet_dishes"] && Array.isArray(data["diet_dishes"])) ? data["diet_dishes"].length : 0,
        }
        
        setImportData(data)
        setImportCounts(counts)
        setShowImportConfirm(true)
      } catch (error) {
        console.error("Failed to parse imported file:", error)
        alert("Failed to import data. Please check the file format.")
      }
    }
    reader.readAsText(file)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleConfirmImport = () => {
    if (importData) {
      handleImport(importData)
      setImportData(null)
      setShowImportConfirm(false)
    }
  }

  const handleImport = (data: Record<string, any>) => {
    let imported = false

    Object.keys(data).forEach((key) => {
      if (key === "exportedAt" || key === "version") {
        return
      }

      try {
        if (key === "tasks") {
          const tasksData = data[key]
          if (Array.isArray(tasksData)) {
            const validTasks = tasksData.filter((task: any) => {
              return (
                task &&
                typeof task === "object" &&
                typeof task.id === "string" &&
                typeof task.title === "string" &&
                typeof task.description === "string" &&
                typeof task.isRepetitive === "boolean" &&
                typeof task.completed === "boolean" &&
                typeof task.createdAt === "number"
              )
            })
            
            if (validTasks.length > 0) {
              setTasks(validTasks)
              setSelectedTaskId(null)
              setEditingTaskId(null)
              imported = true
            }
          }
        } else if (key === "investments") {
          const investmentsData = data[key]
          if (Array.isArray(investmentsData)) {
            const validInvestments = investmentsData.filter((inv: any) => {
              return (
                inv &&
                typeof inv === "object" &&
                typeof inv.id === "string" &&
                typeof inv.symbol === "string" &&
                typeof inv.name === "string" &&
                typeof inv.volume === "number" &&
                typeof inv.purchaseDate === "number" &&
                typeof inv.purchasePrice === "number"
              )
            })
            
            if (validInvestments.length > 0) {
              setInvestments(validInvestments)
              imported = true
            }
          }
        } else if (key === "diet_dishes") {
          const dishesData = data[key]
          if (Array.isArray(dishesData)) {
            const validDishes = dishesData.filter((dish: any) => {
              return (
                dish &&
                typeof dish === "object" &&
                typeof dish.id === "string" &&
                typeof dish.name === "string" &&
                typeof dish.date === "number" &&
                typeof dish.kcal === "number" &&
                typeof dish.protein === "number" &&
                typeof dish.carbs === "number" &&
                typeof dish.fats === "number"
              )
            })
            
            if (validDishes.length > 0) {
              setDishes(validDishes)
              imported = true
            }
          }
        } else {
          localStorage.setItem(key, JSON.stringify(data[key]))
          imported = true
        }
      } catch (error) {
        console.error(`Failed to import ${key}:`, error)
      }
    })

    if (!imported) {
      alert("No valid data found in the imported file.")
    } else {
      window.location.reload()
    }
  }

  const handleClearAll = () => {
    localStorage.clear()
    setTasks([])
    setInvestments([])
    setDishes([])
    setSelectedTaskId(null)
    setEditingTaskId(null)
    setShowClearConfirm(false)
    window.location.reload()
  }

  return (
    <div className="h-full p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Data Management</h2>
            
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleImportClick}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => setShowClearConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Data
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">About</h2>
            <div className="text-sm text-muted-foreground">
              <p>LifeChart - Track your daily habits and tasks</p>
              <p className="mt-2">Version 1.0.0</p>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <ConfirmDialog
        open={showImportConfirm}
        onOpenChange={setShowImportConfirm}
        title="Import Data"
        description={
          `This will replace all your current data with the imported data:${importCounts.tasks > 0 || importCounts.investments > 0 || importCounts.dishes > 0 ? "\n\n" : ""}${importCounts.tasks > 0 ? `• ${importCounts.tasks} task(s)\n` : ""}${importCounts.investments > 0 ? `• ${importCounts.investments} investment(s)\n` : ""}${importCounts.dishes > 0 ? `• ${importCounts.dishes} dish(es)\n` : ""}${importCounts.tasks === 0 && importCounts.investments === 0 && importCounts.dishes === 0 ? "No data found.\n" : ""}\nThis action cannot be undone. Are you sure?`
        }
        confirmText="Import"
        onConfirm={handleConfirmImport}
      />
      
      <ConfirmDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title="Clear All Data"
        description="This will permanently delete all your data including tasks, investments, and diet records. This action cannot be undone. Are you sure?"
        confirmText="Clear All"
        onConfirm={handleClearAll}
      />
    </div>
  )
}

