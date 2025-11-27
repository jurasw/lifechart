import { useState } from "react"
import type { DailyDish } from "@/types/diet"

export const useDiet = () => {
  const [dishes, setDishes] = useState<DailyDish[]>([])
  const [editingDishId, setEditingDishId] = useState<string | null>(null)

  const handleAdd = (dish: Omit<DailyDish, "id" | "createdAt">) => {
    const newDish: DailyDish = {
      ...dish,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
    }
    setDishes([...dishes, newDish])
  }

  const handleUpdate = (id: string, dish: Omit<DailyDish, "id" | "createdAt">) => {
    const existingDish = dishes.find((d) => d.id === id)
    if (!existingDish) return

    const updatedDish: DailyDish = {
      ...dish,
      id,
      createdAt: existingDish.createdAt,
    }
    setDishes(dishes.map((d) => (d.id === id ? updatedDish : d)))
  }

  const handleDelete = (id: string) => {
    setDishes(dishes.filter((d) => d.id !== id))
  }

  return {
    dishes,
    setDishes,
    editingDishId,
    setEditingDishId,
    handleAdd,
    handleUpdate,
    handleDelete,
  }
}

