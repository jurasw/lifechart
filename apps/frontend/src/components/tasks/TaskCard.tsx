import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import type { Task } from "@/types/task"
import { isDateCompleted } from "@/utils/dateUtils"

interface TaskCardProps {
  task: Task
  isSelected: boolean
  onSelect: () => void
  onToggleComplete: () => void
}

export const TaskCard = ({
  task,
  isSelected,
  onSelect,
  onToggleComplete,
}: TaskCardProps) => {
  const today = (() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  })()

  const isCompletedToday = isDateCompleted(task, today)

  return (
    <Card
      className={`border-foreground/30 cursor-pointer transition-colors ${
        isSelected
          ? "border-foreground/60 bg-accent/50"
          : "hover:border-foreground/40"
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-2.5 sm:p-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex-1 space-y-0.5 sm:space-y-1 min-w-0">
            <h3
              className={`text-xs sm:text-sm font-medium break-words ${
                isCompletedToday
                  ? "line-through opacity-50"
                  : "text-foreground"
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p
                className={`text-[10px] sm:text-xs text-muted-foreground break-words line-clamp-1 ${
                  isCompletedToday ? "line-through opacity-50" : ""
                }`}
              >
                {task.description}
              </p>
            )}
            {task.isRepetitive && (
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                {task.period}
                {task.selectedDays && task.selectedDays.length > 0 && (
                  <span className="ml-1">
                    · {task.selectedDays.map((d) => d.slice(0, 3)).join(", ")}
                  </span>
                )}
              </span>
            )}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-1.5 py-0.5 text-[9px] sm:text-[10px] bg-accent/50 rounded border border-foreground/20 text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <Checkbox
              checked={isCompletedToday}
              onChange={(e) => {
                e.stopPropagation()
                onToggleComplete()
              }}
              onClick={(e) => {
                e.stopPropagation()
              }}
              className="flex-shrink-0 border-foreground/30 cursor-pointer h-3.5 w-3.5 sm:h-4 sm:w-4"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

