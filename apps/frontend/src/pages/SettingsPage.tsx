import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { SuccessDialog } from "@/components/SuccessDialog"
import { ErrorDialog } from "@/components/ErrorDialog"
import { Download, Upload, Trash2 } from "lucide-react"
import { useTasks } from "@/hooks/useTasks"
import { useInvestments } from "@/hooks/useInvestments"
import { useDiet } from "@/hooks/useDiet"
import { tasksApi } from "@/services/tasksApi"
import { investmentsApi } from "@/services/investmentsApi"

export const SettingsPage = () => {
  const { tasks, setTasks, setSelectedTaskId, setEditingTaskId } = useTasks()
  const { investments, setInvestments } = useInvestments()
  const { setDishes } = useDiet()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const [importData, setImportData] = useState<any>(null)
  const [importCounts, setImportCounts] = useState({ tasks: 0, investments: 0, dishes: 0 })
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const handleExport = async () => {
    const allData: Record<string, any> = {}
    
    if (tasks && tasks.length > 0) {
      allData.tasks = tasks.map(({ id, ...task }) => task)
    }
    if (investments && investments.length > 0) {
      allData.investments = investments.map(({ id, ...inv }) => inv)
    }

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
        setErrorMessage("Failed to import data. Please check the file format.")
        setShowErrorDialog(true)
      }
    }
    reader.readAsText(file)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleConfirmImport = async () => {
    if (importData) {
      await handleImport(importData)
      setImportData(null)
      setShowImportConfirm(false)
    }
  }

  const handleImport = async (data: Record<string, any>) => {
    let imported = false
    const results: string[] = []

    for (const key of Object.keys(data)) {
      if (key === "exportedAt" || key === "version") {
        continue
      }

      try {
        if (key === "tasks") {
          const tasksData = data[key]
          if (Array.isArray(tasksData)) {
            const validTasks = tasksData.filter((task: any) => {
              return (
                task &&
                typeof task === "object" &&
                typeof task.title === "string" &&
                task.title.trim().length > 0
              )
            })
            
            if (validTasks.length > 0) {
              try {
                const tasksToImport = validTasks.map(({ id, ...task }) => ({
                  title: task.title.trim(),
                  description: task.description ?? '',
                  isRepetitive: task.isRepetitive ?? false,
                  completed: task.completed ?? false,
                  createdAt: task.createdAt ?? Date.now(),
                  period: task.period,
                  selectedDays: task.selectedDays,
                  tags: task.tags,
                  completedDates: task.completedDates,
                  hideHistory: task.hideHistory,
                }))
                const result = await tasksApi.import(tasksToImport)
                if (result.created === 0 && result.skipped > 0) {
                  results.push(`Tasks: ${result.skipped} skipped (check backend logs for errors)`)
                } else {
                  results.push(`Tasks: ${result.created} created, ${result.skipped} skipped`)
                }
                const allTasks = await tasksApi.getAll()
                setTasks(allTasks)
                setSelectedTaskId(null)
                setEditingTaskId(null)
                imported = true
              } catch (error: any) {
                const errorMsg = error.response?.data?.message || error.message || (error.code === 'ERR_NETWORK' ? 'Network error - check if backend is running' : 'Unknown error')
                results.push(`Tasks: Import failed - ${errorMsg}`)
              }
            } else {
              results.push(`Tasks: No valid tasks found (${tasksData.length} total, all invalid)`)
            }
          }
        } else if (key === "investments") {
          const investmentsData = data[key]
          if (Array.isArray(investmentsData)) {
            const validInvestments = investmentsData.filter((inv: any) => {
              return (
                inv &&
                typeof inv === "object" &&
                typeof inv.symbol === "string" &&
                inv.symbol.trim().length > 0 &&
                typeof inv.name === "string" &&
                inv.name.trim().length > 0 &&
                typeof inv.volume === "number" &&
                !isNaN(inv.volume) &&
                typeof inv.purchaseDate === "number" &&
                !isNaN(inv.purchaseDate) &&
                (inv.purchasePrice === null || inv.purchasePrice === undefined || (typeof inv.purchasePrice === "number" && !isNaN(inv.purchasePrice)))
              )
            })
            
            if (validInvestments.length > 0) {
              try {
                const investmentsToImport = validInvestments.map(({ id, ...inv }) => ({
                  symbol: inv.symbol.trim(),
                  name: inv.name.trim(),
                  type: inv.type || 'stock',
                  volume: inv.volume,
                  purchaseDate: inv.purchaseDate,
                  purchasePrice: inv.purchasePrice ?? null,
                  purchaseCurrency: inv.purchaseCurrency || 'PLN',
                  currentPrice: inv.currentPrice ?? null,
                  lastUpdated: inv.lastUpdated ?? null,
                }))
                const result = await investmentsApi.import(investmentsToImport)
                results.push(`Investments: ${result.created} created, ${result.skipped} skipped`)
                const allInvestments = await investmentsApi.getAll()
                setInvestments(allInvestments)
                imported = true
              } catch (error: any) {
                const errorMsg = error.response?.data?.message || error.message || (error.code === 'ERR_NETWORK' ? 'Network error - check if backend is running' : 'Unknown error')
                results.push(`Investments: Import failed - ${errorMsg}`)
              }
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
        }
      } catch (error) {
      }
    }

    if (!imported) {
      setErrorMessage("No valid data found in the imported file.")
      setShowErrorDialog(true)
    } else {
      setSuccessMessage(`Import completed!\n\n${results.join('\n')}`)
      setShowSuccessDialog(true)
    }
  }

  const handleClearAll = async () => {
    try {
      const [tasksResult, investmentsResult] = await Promise.all([
        tasksApi.clearAll().catch(err => {
          return { deleted: 0, error: err.message }
        }),
        investmentsApi.clearAll().catch(err => {
          return { deleted: 0, error: err.message }
        })
      ])

      setTasks([])
      setInvestments([])
      setDishes([])
      setSelectedTaskId(null)
      setEditingTaskId(null)
      setShowClearConfirm(false)

      const allTasks = await tasksApi.getAll()
      const allInvestments = await investmentsApi.getAll()
      setTasks(allTasks)
      setInvestments(allInvestments)
      
      const deletedTasks = typeof tasksResult === 'object' && 'deleted' in tasksResult ? tasksResult.deleted : 0
      const deletedInvestments = typeof investmentsResult === 'object' && 'deleted' in investmentsResult ? investmentsResult.deleted : 0
      
      setSuccessMessage(`All data cleared successfully!\n\n• ${deletedTasks} task(s) deleted\n• ${deletedInvestments} investment(s) deleted\n\nYou remain logged in.`)
      setShowSuccessDialog(true)
    } catch (error: any) {
      setErrorMessage(`Error clearing data: ${error.response?.data?.message || error.message || 'Unknown error'}`)
      setShowErrorDialog(true)
    }
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

      <SuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title="Success"
        message={successMessage}
      />

      <ErrorDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        title="Error"
        message={errorMessage}
      />
    </div>
  )
}

