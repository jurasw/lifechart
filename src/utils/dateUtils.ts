import type { Task, DayOfWeek } from "@/types/task"

export const getDatesForPeriod = (period: "week" | "month" | "year") => {
  const dates: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (period === "week") {
    const startOfWeek = new Date(today)
    const dayOfWeek = today.getDay()
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    startOfWeek.setDate(today.getDate() - daysFromMonday)
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }
  } else if (period === "month") {
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    for (let i = 0; i < daysInMonth; i++) {
      const date = new Date(startOfMonth)
      date.setDate(startOfMonth.getDate() + i)
      dates.push(date)
    }
  } else if (period === "year") {
    const startOfYear = new Date(today.getFullYear(), 0, 1)
    for (let i = 0; i < 365; i++) {
      const date = new Date(startOfYear)
      date.setDate(startOfYear.getDate() + i)
      if (date.getFullYear() === today.getFullYear()) {
        dates.push(date)
      }
    }
  }

  return dates
}

export const isDateCompleted = (task: Task, date: Date) => {
  if (!task.completedDates || task.completedDates.length === 0) return false
  
  if (task.period === "monthly") {
    const dateMonth = date.getMonth()
    const dateYear = date.getFullYear()
    
    return task.completedDates.some((completedTimestamp) => {
      const completedDate = new Date(completedTimestamp)
      completedDate.setHours(0, 0, 0, 0)
      return (
        completedDate.getMonth() === dateMonth &&
        completedDate.getFullYear() === dateYear
      )
    })
  }
  
  if (task.period === "weekly") {
    const dateTimestamp = date.getTime()
    return task.completedDates.includes(dateTimestamp)
  }
  
  if (task.period === "yearly") {
    const dateMonth = date.getMonth()
    const dateDay = date.getDate()
    const taskCreatedDate = new Date(task.createdAt)
    
    if (dateMonth !== taskCreatedDate.getMonth() || dateDay !== taskCreatedDate.getDate()) {
      return false
    }
    
    return task.completedDates.some((completedTimestamp) => {
      const completedDate = new Date(completedTimestamp)
      completedDate.setHours(0, 0, 0, 0)
      return (
        completedDate.getMonth() === dateMonth &&
        completedDate.getDate() === dateDay
      )
    })
  }
  
  const dateTimestamp = date.getTime()
  return task.completedDates.includes(dateTimestamp)
}

export const shouldShowDate = (task: Task, date: Date) => {
  if (!task.isRepetitive || !task.period) return true
  if (task.period === "daily") return true

  if (task.period === "weekly") {
    if (!task.selectedDays || task.selectedDays.length === 0) {
      return false
    }
    const dayNames: DayOfWeek[] = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ]
    const dayOfWeek = dayNames[date.getDay()]
    return task.selectedDays.includes(dayOfWeek)
  }

  if (task.period === "monthly") {
    return date.getDate() === 1
  }

  if (task.period === "yearly") {
    const taskCreatedDate = new Date(task.createdAt)
    return (
      date.getMonth() === taskCreatedDate.getMonth() &&
      date.getDate() === taskCreatedDate.getDate()
    )
  }

  return true
}

export const shouldShowTaskToday = (task: Task): boolean => {
  if (!task.isRepetitive || !task.period) return true
  if (task.period === "daily") return true
  if (task.period === "monthly") return true
  
  if (task.period === "weekly") {
    if (!task.selectedDays || task.selectedDays.length === 0) {
      return false
    }
    const today = new Date()
    const dayNames: DayOfWeek[] = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ]
    const todayDayOfWeek = dayNames[today.getDay()]
    return task.selectedDays.includes(todayDayOfWeek)
  }
  
  if (task.period === "yearly") {
    const today = new Date()
    const taskCreatedDate = new Date(task.createdAt)
    return (
      today.getMonth() === taskCreatedDate.getMonth() &&
      today.getDate() === taskCreatedDate.getDate()
    )
  }
  
  return true
}

export const getAvailablePeriods = (task: Task): ("week" | "month" | "year")[] => {
  if (task.period === "monthly") {
    return ["year"]
  }
  
  const periods: ("week" | "month" | "year")[] = []
  
  for (const period of ["week", "month", "year"] as const) {
    const dates = getDatesForPeriod(period)
    const filteredDates = dates.filter((date) => shouldShowDate(task, date))
    if (filteredDates.length > 0) {
      periods.push(period)
    }
  }
  
  return periods
}

export const isTaskCompletedForPeriod = (task: Task, period: "daily" | "monthly" | "yearly"): boolean => {
  if (!task.completedDates || task.completedDates.length === 0) return false
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (period === "daily") {
    return task.completed
  }
  
  if (period === "monthly") {
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
    return task.completedDates.some((timestamp) => {
      const completedDate = new Date(timestamp)
      completedDate.setHours(0, 0, 0, 0)
      return (
        completedDate.getMonth() === currentMonth &&
        completedDate.getFullYear() === currentYear
      )
    })
  }
  
  if (period === "yearly") {
    const currentYear = today.getFullYear()
    
    return task.completedDates.some((timestamp) => {
      const completedDate = new Date(timestamp)
      completedDate.setHours(0, 0, 0, 0)
      return completedDate.getFullYear() === currentYear
    })
  }
  
  return false
}

