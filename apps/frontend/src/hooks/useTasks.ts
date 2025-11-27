import { useState } from "react"
import type { Task } from "@/types/task"

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const handleToggleComplete = (id: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = today.getTime()

    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          const newCompleted = !task.completed
          const completedDates = task.completedDates || []
          
          if (newCompleted) {
            if (!completedDates.includes(todayTimestamp)) {
              return {
                ...task,
                completed: newCompleted,
                completedDates: [...completedDates, todayTimestamp],
              }
            }
          } else {
            return {
              ...task,
              completed: newCompleted,
              completedDates: completedDates.filter((date) => date !== todayTimestamp),
            }
          }
        }
        return task
      })
    )
  }

  const handleDelete = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const handleToggleDate = (id: string, date: Date) => {
    const normalizedDate = new Date(date)
    normalizedDate.setHours(0, 0, 0, 0)
    const dateTimestamp = normalizedDate.getTime()

    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          const completedDates = task.completedDates || []
          const isCompleted = completedDates.includes(dateTimestamp)

          if (isCompleted) {
            return {
              ...task,
              completedDates: completedDates.filter((date) => date !== dateTimestamp),
            }
          } else {
            return {
              ...task,
              completedDates: [...completedDates, dateTimestamp],
            }
          }
        }
        return task
      })
    )
  }

  return {
    tasks,
    setTasks,
    editingTaskId,
    setEditingTaskId,
    selectedTaskId,
    setSelectedTaskId,
    handleToggleComplete,
    handleDelete,
    handleToggleDate,
  }
}

