import { useState, useMemo, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Task } from "@/types/task"
import { isDateCompleted, shouldShowDate } from "@/utils/dateUtils"

interface TaskHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task | null
  onToggleDate: (taskId: string, date: Date) => void
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export const TaskHistoryDialog = ({
  open,
  onOpenChange,
  task,
  onToggleDate,
}: TaskHistoryDialogProps) => {
  const [month, setMonth] = useState<Date>(new Date())
  const [year, setYear] = useState<number>(new Date().getFullYear())
  
  const getToday = () => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }

  const today = getToday()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()

  const isMonthlyTask = task?.period === "monthly"

  const completedMonths = useMemo(() => {
    if (!task?.completedDates || !isMonthlyTask) return new Set<string>()
    const months = new Set<string>()
    task.completedDates.forEach((timestamp) => {
      const date = new Date(timestamp)
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`
      months.add(monthKey)
    })
    return months
  }, [task, isMonthlyTask])

  const handleMonthClick = useCallback((monthIndex: number, yearValue: number) => {
    if (!task) return
    
    const monthDate = new Date(yearValue, monthIndex, 1)
    monthDate.setHours(0, 0, 0, 0)
    
    if (monthDate > today) return
    
    const testDate = new Date(yearValue, monthIndex, 1)
    const isCompleted = isDateCompleted(task, testDate)
    
    if (isCompleted) {
      const completedDate = task.completedDates?.find((timestamp) => {
        const date = new Date(timestamp)
        return date.getMonth() === monthIndex && date.getFullYear() === yearValue
      })
      if (completedDate) {
        onToggleDate(task.id, new Date(completedDate))
      }
    } else {
      onToggleDate(task.id, monthDate)
    }
  }, [task, onToggleDate, today])

  const selectedDates = useMemo(() => {
    if (!task?.completedDates || isMonthlyTask) return []
    return task.completedDates.map((timestamp) => {
      const date = new Date(timestamp)
      date.setHours(0, 0, 0, 0)
      return date
    })
  }, [task, isMonthlyTask])

  const handleDateSelect = useCallback((dates: Date[] | undefined) => {
    if (!dates || !task || isMonthlyTask) return
    
    const currentTimestamps = new Set(
      selectedDates.map((d) => {
        const normalized = new Date(d)
        normalized.setHours(0, 0, 0, 0)
        return normalized.getTime()
      })
    )
    
    const newTimestamps = new Set(
      dates.map((d) => {
        const normalized = new Date(d)
        normalized.setHours(0, 0, 0, 0)
        return normalized.getTime()
      })
    )
    
    const addedDate = dates.find((d) => {
      const normalized = new Date(d)
      normalized.setHours(0, 0, 0, 0)
      const timestamp = normalized.getTime()
      return !currentTimestamps.has(timestamp) && normalized <= today
    })
    
    const removedDate = selectedDates.find((d) => {
      const normalized = new Date(d)
      normalized.setHours(0, 0, 0, 0)
      const timestamp = normalized.getTime()
      return !newTimestamps.has(timestamp) && normalized <= today
    })
    
    const dateToToggle = addedDate || removedDate
    if (dateToToggle) {
      const normalizedDate = new Date(dateToToggle)
      normalizedDate.setHours(0, 0, 0, 0)
      if (normalizedDate <= today) {
        onToggleDate(task.id, normalizedDate)
      }
    }
  }, [task, onToggleDate, today, selectedDates, isMonthlyTask])

  const disabledDays = useCallback((date: Date) => {
    if (!task) return true
    
    const normalizedDate = new Date(date)
    normalizedDate.setHours(0, 0, 0, 0)
    
    if (normalizedDate > today) return true
    
    if (!shouldShowDate(task, date)) return true
    
    return false
  }, [today, task])

  const isMonthDisabled = useCallback((monthIndex: number, yearValue: number) => {
    if (yearValue > currentYear) return true
    if (yearValue === currentYear && monthIndex > currentMonth) return true
    return false
  }, [currentYear, currentMonth])

  if (isMonthlyTask) {
    return (
      <Dialog open={open && !!task} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-sm sm:max-w-md p-6"
          onClose={() => onOpenChange(false)}
        >
          {task && (
            <>
              <DialogHeader className="space-y-2 pb-4">
                <DialogTitle className="text-base sm:text-lg font-semibold">
                  {task.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setYear(year - 1)}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">{year}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setYear(year + 1)}
                    disabled={year >= currentYear}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {monthNames.map((monthName, index) => {
                    const monthKey = `${year}-${index}`
                    const isCompleted = completedMonths.has(monthKey)
                    const disabled = isMonthDisabled(index, year)
                    
                    return (
                      <Button
                        key={index}
                        variant={isCompleted ? "default" : "outline"}
                        onClick={() => handleMonthClick(index, year)}
                        disabled={disabled}
                        className={`h-12 ${isCompleted ? "bg-accent text-accent-foreground border border-foreground" : ""}`}
                      >
                        {monthName.slice(0, 3)}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open && !!task} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm sm:max-w-md p-6"
        onClose={() => onOpenChange(false)}
      >
        {task && (
          <>
            <DialogHeader className="space-y-2 pb-4">
              <DialogTitle className="text-base sm:text-lg font-semibold">
                {task.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-center">
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={handleDateSelect}
                  month={month}
                  onMonthChange={setMonth}
                  disabled={disabledDays}
                  className="rounded-lg border shadow-sm"
                />
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

