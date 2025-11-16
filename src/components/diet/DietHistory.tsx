import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format, isSameDay } from "date-fns"
import type { DailyDish } from "@/types/diet"
import { DishCard } from "./DishCard"

interface DietHistoryProps {
  dishes: DailyDish[]
  onEdit: (dish: DailyDish) => void
  onDelete: (id: string) => void
}

interface DayGroup {
  date: Date
  dishes: DailyDish[]
  totals: {
    kcal: number
    protein: number
    carbs: number
    fats: number
    fiber: number
  }
}

export const DietHistory = ({ dishes, onEdit, onDelete }: DietHistoryProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const groupedByDate = useMemo(() => {
    const groups = new Map<string, DayGroup>()

    dishes.forEach((dish) => {
      const dishDate = new Date(dish.date)
      dishDate.setHours(0, 0, 0, 0)
      const dateKey = dishDate.toISOString()

      const existing = groups.get(dateKey)
      if (existing) {
        existing.dishes.push(dish)
        existing.totals.kcal += dish.kcal
        existing.totals.protein += dish.protein
        existing.totals.carbs += dish.carbs
        existing.totals.fats += dish.fats
        existing.totals.fiber += (dish.fiber || 0)
      } else {
        groups.set(dateKey, {
          date: dishDate,
          dishes: [dish],
          totals: {
            kcal: dish.kcal,
            protein: dish.protein,
            carbs: dish.carbs,
            fats: dish.fats,
            fiber: dish.fiber || 0,
          },
        })
      }
    })

    return Array.from(groups.values()).sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [dishes])

  const filteredGroups = useMemo(() => {
    if (!selectedDate) return groupedByDate
    return groupedByDate.filter((group) => isSameDay(group.date, selectedDate))
  }, [groupedByDate, selectedDate])

  return (
    <Card className="border-foreground/30">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-lg font-semibold">History</h2>
          <div className="flex gap-2">
            <Button
              variant={selectedDate === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDate(null)}
            >
              All Days
            </Button>
            <input
              type="date"
              value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
              onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
              className="px-3 py-1.5 text-sm border border-border rounded-md bg-background"
            />
          </div>
        </div>

        {filteredGroups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {selectedDate
              ? `No dishes found for ${format(selectedDate, "MMM d, yyyy")}`
              : "No dishes recorded yet"}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredGroups.map((group) => (
              <div key={group.date.toISOString()}>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                  <h3 className="font-semibold text-foreground">
                    {format(group.date, "EEEE, MMMM d, yyyy")}
                  </h3>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Calories: </span>
                      <span className="font-medium">{group.totals.kcal} kcal</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">P: </span>
                      <span className="font-medium">{group.totals.protein}g</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">C: </span>
                      <span className="font-medium">{group.totals.carbs}g</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">F: </span>
                      <span className="font-medium">{group.totals.fats}g</span>
                    </div>
                    {group.totals.fiber > 0 && (
                      <div>
                        <span className="text-muted-foreground">Fiber: </span>
                        <span className="font-medium">{group.totals.fiber}g</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  {group.dishes.map((dish) => (
                    <DishCard
                      key={dish.id}
                      dish={dish}
                      onEdit={() => onEdit(dish)}
                      onDelete={() => onDelete(dish.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

