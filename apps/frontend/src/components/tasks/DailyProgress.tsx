import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import type { Task } from "@/types/task"
import { isTaskCompletedForPeriod } from "@/utils/dateUtils"

interface DailyProgressProps {
  tasks: Task[]
  period: "daily" | "monthly" | "yearly" | "all"
}

export const DailyProgress = ({ tasks, period }: DailyProgressProps) => {
  const progress = useMemo(() => {
    const periodTasks = tasks.filter((task) => {
      if (period === "all") {
        return true
      }
      if (!task.isRepetitive || !task.period) {
        return period === "daily"
      }
      if (period === "daily") {
        return task.period === "daily"
      }
      if (period === "monthly") {
        return task.period === "daily" || task.period === "weekly" || task.period === "monthly"
      }
      if (period === "yearly") {
        return true
      }
      return false
    })
    
    if (periodTasks.length === 0) {
      return null
    }
    
    const completedCount = periodTasks.filter((task) => {
      if (period === "all") {
        return task.completed
      }
      return isTaskCompletedForPeriod(task, period)
    }).length
    
    const percentage = Math.round((completedCount / periodTasks.length) * 100)
    
    return {
      completed: completedCount,
      total: periodTasks.length,
      percentage,
    }
  }, [tasks, period])
  
  if (!progress) {
    return null
  }
  
  const radius = 30
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress.percentage / 100) * circumference
  
  return (
    <Card className="border-foreground/30">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="30"
                stroke="currentColor"
                strokeWidth="5"
                fill="none"
                className="text-foreground/20"
              />
              <circle
                cx="50%"
                cy="50%"
                r="30"
                stroke="currentColor"
                strokeWidth="5"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="text-foreground transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm sm:text-base font-semibold">
                {progress.percentage}%
              </span>
            </div>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
            {progress.completed} / {progress.total}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

