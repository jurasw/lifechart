import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useDiet } from "@/hooks/useDiet"
import { AddDishDialog } from "@/components/diet/AddDishDialog"
import { DietChart } from "@/components/diet/DietChart"
import { DietHistory } from "@/components/diet/DietHistory"
import type { DailyDish } from "@/types/diet"

export const DietPage = () => {
  const {
    dishes,
    editingDishId,
    setEditingDishId,
    handleAdd,
    handleUpdate,
    handleDelete,
  } = useDiet()

  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const editingDish = useMemo(
    () => dishes.find((d) => d.id === editingDishId) || null,
    [dishes, editingDishId]
  )

  const handleSubmit = (dish: Omit<DailyDish, "id" | "createdAt">) => {
    if (editingDishId) {
      handleUpdate(editingDishId, dish)
      setEditingDishId(null)
    } else {
      handleAdd(dish)
    }
    setIsDialogOpen(false)
  }

  const handleEdit = (dish: DailyDish) => {
    setEditingDishId(dish.id)
    setIsDialogOpen(true)
  }

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setEditingDishId(null)
    }
  }

  return (
    <div className="h-full p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Diet</h1>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Dish
          </Button>
        </div>

        {dishes.length > 0 && <DietChart dishes={dishes} />}

        <DietHistory
          dishes={dishes}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <AddDishDialog
          open={isDialogOpen}
          onOpenChange={handleDialogClose}
          onSubmit={handleSubmit}
          editingDish={editingDish}
        />
      </div>
    </div>
  )
}
