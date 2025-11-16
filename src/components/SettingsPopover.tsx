import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover } from "@/components/ui/popover"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { Settings, Download, Upload, Trash2 } from "lucide-react"

interface SettingsPopoverProps {
  onExport: () => void
  onImport: (data: any) => void
  onClearAll: () => void
}

export const SettingsPopover = ({ onExport, onImport, onClearAll }: SettingsPopoverProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const [importData, setImportData] = useState<any>(null)
  const [importTaskCount, setImportTaskCount] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        const taskCount = data.tasks && Array.isArray(data.tasks) ? data.tasks.length : 0
        setImportData(data)
        setImportTaskCount(taskCount)
        setShowImportConfirm(true)
        setIsOpen(false)
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
      onImport(importData)
      setImportData(null)
    }
  }

  const handleClearClick = () => {
    setShowClearConfirm(true)
    setIsOpen(false)
  }

  return (
    <>
      <Popover
        open={isOpen}
        onOpenChange={setIsOpen}
        trigger={
          <Button variant="outline" className="rounded-md" size="sm">
            <Settings className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        }
      >
        <div className="space-y-2">
          <h3 className="font-semibold text-xs sm:text-sm mb-3">Settings</h3>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              onExport()
              setIsOpen(false)
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleImportClick}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Data
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={handleClearClick}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Data
          </Button>
        </div>
      </Popover>
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
          importTaskCount > 0
            ? `This will replace all your current tasks with ${importTaskCount} imported task(s). Are you sure?`
            : "This will replace all your current tasks with the imported data. Are you sure?"
        }
        confirmText="Import"
        onConfirm={handleConfirmImport}
      />
      <ConfirmDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title="Clear All Data"
        description="This will permanently delete all your tasks. This action cannot be undone. Are you sure?"
        confirmText="Clear All"
        onConfirm={onClearAll}
      />
    </>
  )
}

