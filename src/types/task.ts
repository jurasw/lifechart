export type TaskPeriod = "daily" | "weekly" | "monthly" | "yearly"

export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"

export interface Task {
  id: string
  title: string
  description: string
  isRepetitive: boolean
  period?: TaskPeriod
  selectedDays?: DayOfWeek[]
  tags?: string[]
  completed: boolean
  createdAt: number
  completedDates?: number[]
  hideHistory?: boolean
}

