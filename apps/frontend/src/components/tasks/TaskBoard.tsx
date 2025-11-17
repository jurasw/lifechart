import { Card, CardContent } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { getDatesForPeriod, isDateCompleted, shouldShowDate, getAvailablePeriods } from "@/utils/dateUtils"
import type { Task } from "@/types/task"

interface TaskBoardProps {
  task: Task
  period: "week" | "month" | "year"
  onPeriodChange: (period: "week" | "month" | "year") => void
}

export const TaskBoard = ({ task, period, onPeriodChange }: TaskBoardProps) => {
  const availablePeriods = getAvailablePeriods(task)
  
  if (availablePeriods.length === 0) {
    return null
  }

  const allBoardDates = getDatesForPeriod(period)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTimestamp = today.getTime()
  
  const filteredDates = allBoardDates.filter((date) => {
    if (period === "week") {
      const normalizedDate = new Date(date)
      normalizedDate.setHours(0, 0, 0, 0)
      return normalizedDate.getTime() >= todayTimestamp && shouldShowDate(task, date)
    }
    return shouldShowDate(task, date)
  })
  
  const todayString = today.toDateString()
  
  const boardDatesSet = new Set<string>()
  filteredDates.forEach((date) => {
    boardDatesSet.add(date.toDateString())
  })
  
  const todayInPeriod = allBoardDates.find((date) => date.toDateString() === todayString)
  
  if (todayInPeriod && !boardDatesSet.has(todayString) && shouldShowDate(task, today)) {
    boardDatesSet.add(todayString)
  }
  
  const boardDates = allBoardDates
    .filter((date) => boardDatesSet.has(date.toDateString()))
    .sort((a, b) => a.getTime() - b.getTime())

  return (
    <Card className="border-foreground/30">
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs sm:text-sm font-semibold truncate">{task.title}</h3>
            {availablePeriods.length > 1 ? (
              <Select
                value={period}
                onChange={(e) =>
                  onPeriodChange(e.target.value as "week" | "month" | "year")
                }
                className="h-7 sm:h-8 text-xs w-20 sm:w-24 flex-shrink-0"
              >
                {availablePeriods.includes("week") && (
                  <option value="week">Week</option>
                )}
                {availablePeriods.includes("month") && (
                  <option value="month">Month</option>
                )}
                {availablePeriods.includes("year") && (
                  <option value="year">Year</option>
                )}
              </Select>
            ) : (
              <span className="text-xs sm:text-sm text-muted-foreground capitalize">
                {availablePeriods[0]}
              </span>
            )}
          </div>
          {boardDates.length > 0 && (
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              {boardDates.map((date, index) => {
                const isCompleted = isDateCompleted(task, date)
                const isToday =
                  date.toDateString() === new Date().toDateString()
                return (
                  <div
                    key={index}
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm border transition-colors ${
                      isCompleted
                        ? "bg-foreground border-foreground"
                        : "border-foreground/30 bg-transparent"
                    } ${isToday ? "ring-1 ring-foreground/50" : ""}`}
                    title={date.toLocaleDateString()}
                  />
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

