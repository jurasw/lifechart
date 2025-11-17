import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2 } from "lucide-react"
import { format } from "date-fns"
import type { DailyDish } from "@/types/diet"

interface DishCardProps {
  dish: DailyDish
  onEdit: () => void
  onDelete: () => void
}

export const DishCard = ({ dish, onEdit, onDelete }: DishCardProps) => {
  const date = new Date(dish.date)

  return (
    <Card className="border-foreground/30">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-foreground">{dish.name}</h3>
              <span className="text-xs text-muted-foreground">
                {format(date, "MMM d, yyyy")}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div>
                <div className="text-xs text-muted-foreground">Calories</div>
                <div className="text-sm font-medium">{dish.kcal} kcal</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Protein</div>
                <div className="text-sm font-medium">{dish.protein}g</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Carbs</div>
                <div className="text-sm font-medium">{dish.carbs}g</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Fats</div>
                <div className="text-sm font-medium">{dish.fats}g</div>
              </div>
            </div>

            {dish.fiber !== undefined && (
              <div className="text-xs text-muted-foreground mb-2">
                Fiber: {dish.fiber}g
              </div>
            )}

            {dish.notes && (
              <div className="text-xs text-muted-foreground mb-2">{dish.notes}</div>
            )}

            {dish.micronutrients && Object.keys(dish.micronutrients).length > 0 && (
              <div className="mt-2 pt-2 border-t border-border">
                <div className="text-xs text-muted-foreground mb-1">Micronutrients:</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {Object.entries(dish.micronutrients).map(([key, value]) => {
                    if (value === undefined) return null
                    const label = key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())
                    return (
                      <span key={key} className="text-muted-foreground">
                        {label}: {value}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 ml-2">
            <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

