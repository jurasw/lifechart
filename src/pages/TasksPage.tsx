import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useTasks } from "@/hooks/useTasks"
import { EmptyState } from "@/components/tasks/EmptyState"
import { AddTaskDialog } from "@/components/tasks/AddTaskDialog"
import { TaskCard } from "@/components/tasks/TaskCard"
import { TaskBoard } from "@/components/tasks/TaskBoard"
import { TasksPopover } from "@/components/tasks/TasksPopover"
import { TagFilterPopover } from "@/components/tasks/TagFilterPopover"
import { DailyProgress } from "@/components/tasks/DailyProgress"
import type { Task } from "@/types/task"
import { getAvailablePeriods, shouldShowTaskToday } from "@/utils/dateUtils"

export const TasksPage = () => {
  const {
    tasks,
    setTasks,
    editingTaskId,
    setEditingTaskId,
    selectedTaskId,
    setSelectedTaskId,
    handleToggleComplete,
    handleDelete,
    handleToggleDate,
  } = useTasks()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [boardPeriod, setBoardPeriod] = useState<"week" | "month" | "year">("week")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<"daily" | "monthly" | "yearly" | null>(null)

  const editingTask = tasks.find((t) => t.id === editingTaskId) || null
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null

  const availablePeriods = selectedTask ? getAvailablePeriods(selectedTask) : []
  const validBoardPeriod = availablePeriods.includes(boardPeriod)
    ? boardPeriod
    : availablePeriods[0] || "week"

  const filteredTasks = useMemo(() => {
    const hasFilters = selectedPeriod !== null || selectedTags.length > 0
    
    let result = hasFilters 
      ? tasks.filter((task) => shouldShowTaskToday(task))
      : tasks
    
    if (selectedPeriod) {
      result = result.filter((task) => {
        if (!task.isRepetitive || !task.period) {
          return selectedPeriod === "daily"
        }
        if (selectedPeriod === "daily") {
          return task.period === "daily"
        }
        if (selectedPeriod === "monthly") {
          return task.period === "daily" || task.period === "weekly" || task.period === "monthly"
        }
        if (selectedPeriod === "yearly") {
          return true
        }
        return false
      })
    }
    
    if (selectedTags.length > 0) {
      result = result.filter((task) => {
        if (!task.tags || task.tags.length === 0) {
          return false
        }
        return selectedTags.some((selectedTag) => task.tags?.includes(selectedTag))
      })
    }
    
    return result
  }, [tasks, selectedTags, selectedPeriod])

  useEffect(() => {
    if (selectedTaskId && !filteredTasks.find((t) => t.id === selectedTaskId)) {
      setSelectedTaskId(null)
    }
  }, [filteredTasks, selectedTaskId, setSelectedTaskId])

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleClearFilters = () => {
    setSelectedTags([])
    setSelectedPeriod(null)
  }

  const handleTaskSubmit = (taskData: Omit<Task, "id" | "createdAt" | "completed" | "completedDates">) => {
    if (editingTaskId) {
      setTasks(
        tasks.map((task) =>
          task.id === editingTaskId
            ? {
                ...task,
                ...taskData,
              }
            : task
        )
      )
      setEditingTaskId(null)
    } else {
      const newTask: Task = {
        ...taskData,
        id: Date.now().toString(),
        completed: false,
        createdAt: Date.now(),
      }
      setTasks([...tasks, newTask])
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTaskId(task.id)
    setIsDialogOpen(true)
  }

  const handleTaskSelect = (task: Task) => {
    if (selectedTaskId === task.id) {
      setSelectedTaskId(null)
    } else {
      setSelectedTaskId(task.id)
      if (task.period === "monthly") {
        setBoardPeriod("year")
      } else {
        const periods = getAvailablePeriods(task)
        if (periods.length > 0 && !periods.includes(boardPeriod)) {
          setBoardPeriod(periods[0])
        }
      }
    }
  }

  if (tasks.length === 0) {
    return (
      <>
        <EmptyState onAddTask={() => setIsDialogOpen(true)} />
        <AddTaskDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={handleTaskSubmit}
          editingTask={null}
        />
      </>
    )
  }

  return (
    <div className="h-full p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto">
      <div className="fixed top-3 left-[17rem] sm:top-4 sm:left-[17rem] md:top-6 md:left-[17rem] lg:top-8 lg:left-[17rem] z-40 flex gap-2">
        <Button
          onClick={() => {
            setEditingTaskId(null)
            setIsDialogOpen(true)
          }}
          variant="outline"
          className="rounded-md"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
        <TasksPopover
          tasks={tasks}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleDate={handleToggleDate}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 mt-20 sm:mt-24 lg:items-start">
        <div className="w-full lg:max-w-md lg:flex-1">
          <div className="mb-4">
            <TagFilterPopover
              tasks={tasks}
              selectedTags={selectedTags}
              selectedPeriod={selectedPeriod}
              onTagToggle={handleTagToggle}
              onPeriodChange={setSelectedPeriod}
              onClearFilters={handleClearFilters}
            />
          </div>
          <div className="space-y-2">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {selectedTags.length > 0
                  ? "No tasks match the selected tags"
                  : "No tasks yet"}
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isSelected={selectedTaskId === task.id}
                  onSelect={() => handleTaskSelect(task)}
                  onToggleComplete={() => handleToggleComplete(task.id)}
                />
              ))
            )}
          </div>
        </div>

        <div className="w-full lg:w-auto lg:mt-[3.25rem]">
          <DailyProgress 
            tasks={selectedPeriod || selectedTags.length > 0 ? filteredTasks : tasks} 
            period={selectedPeriod || "all"} 
          />
        </div>

        {selectedTask && availablePeriods.length > 0 && (
          <div className="w-full lg:flex-1 lg:max-w-md lg:mt-[3.25rem]">
            <TaskBoard
              task={selectedTask}
              period={validBoardPeriod}
              onPeriodChange={setBoardPeriod}
            />
          </div>
        )}
      </div>

      <AddTaskDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingTaskId(null)
          }
        }}
        onSubmit={handleTaskSubmit}
        editingTask={editingTask}
      />
    </div>
  )
}

