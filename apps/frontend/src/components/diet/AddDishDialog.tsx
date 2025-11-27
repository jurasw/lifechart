import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Loader2 } from "lucide-react"
import type { DailyDish, Micronutrients } from "@/types/diet"
import { format } from "date-fns"
import { parseDishDescription } from "@/services/nutritionApi"

interface AddDishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (dish: Omit<DailyDish, "id" | "createdAt">) => void
  editingDish?: DailyDish | null
}

const micronutrientFields: Array<{ key: keyof Micronutrients; label: string; unit: string }> = [
  { key: "vitaminA", label: "Vitamin A", unit: "mcg" },
  { key: "vitaminC", label: "Vitamin C", unit: "mg" },
  { key: "vitaminD", label: "Vitamin D", unit: "mcg" },
  { key: "vitaminE", label: "Vitamin E", unit: "mg" },
  { key: "vitaminK", label: "Vitamin K", unit: "mcg" },
  { key: "thiamin", label: "Thiamin (B1)", unit: "mg" },
  { key: "riboflavin", label: "Riboflavin (B2)", unit: "mg" },
  { key: "niacin", label: "Niacin (B3)", unit: "mg" },
  { key: "vitaminB6", label: "Vitamin B6", unit: "mg" },
  { key: "folate", label: "Folate", unit: "mcg" },
  { key: "vitaminB12", label: "Vitamin B12", unit: "mcg" },
  { key: "biotin", label: "Biotin", unit: "mcg" },
  { key: "pantothenicAcid", label: "Pantothenic Acid", unit: "mg" },
  { key: "choline", label: "Choline", unit: "mg" },
  { key: "calcium", label: "Calcium", unit: "mg" },
  { key: "iron", label: "Iron", unit: "mg" },
  { key: "magnesium", label: "Magnesium", unit: "mg" },
  { key: "phosphorus", label: "Phosphorus", unit: "mg" },
  { key: "potassium", label: "Potassium", unit: "mg" },
  { key: "sodium", label: "Sodium", unit: "mg" },
  { key: "zinc", label: "Zinc", unit: "mg" },
  { key: "copper", label: "Copper", unit: "mg" },
  { key: "manganese", label: "Manganese", unit: "mg" },
  { key: "selenium", label: "Selenium", unit: "mcg" },
  { key: "chromium", label: "Chromium", unit: "mcg" },
  { key: "molybdenum", label: "Molybdenum", unit: "mcg" },
  { key: "iodine", label: "Iodine", unit: "mcg" },
]

export const AddDishDialog = ({ open, onOpenChange, onSubmit, editingDish }: AddDishDialogProps) => {
  const [name, setName] = useState("")
  const [date, setDate] = useState<Date>(new Date())
  const [kcal, setKcal] = useState("")
  const [protein, setProtein] = useState("")
  const [carbs, setCarbs] = useState("")
  const [fats, setFats] = useState("")
  const [fiber, setFiber] = useState("")
  const [notes, setNotes] = useState("")
  const [showMicronutrients, setShowMicronutrients] = useState(false)
  const [micronutrients, setMicronutrients] = useState<Micronutrients>({})
  
  const [dishDescription, setDishDescription] = useState("")
  const [isParsingDescription, setIsParsingDescription] = useState(false)

  useEffect(() => {
    if (editingDish) {
      setName(editingDish.name)
      setDate(new Date(editingDish.date))
      setKcal(editingDish.kcal.toString())
      setProtein(editingDish.protein.toString())
      setCarbs(editingDish.carbs.toString())
      setFats(editingDish.fats.toString())
      setFiber(editingDish.fiber?.toString() || "")
      setNotes(editingDish.notes || "")
      setMicronutrients(editingDish.micronutrients || {})
      setShowMicronutrients(!!editingDish.micronutrients && Object.keys(editingDish.micronutrients).length > 0)
      setDishDescription("")
    } else {
      setName("")
      setDate(new Date())
      setKcal("")
      setProtein("")
      setCarbs("")
      setFats("")
      setFiber("")
      setNotes("")
      setMicronutrients({})
      setShowMicronutrients(false)
      setDishDescription("")
    }
  }, [editingDish, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const dateStart = new Date(date)
    dateStart.setHours(0, 0, 0, 0)
    const dateTimestamp = dateStart.getTime()

    const dish: Omit<DailyDish, "id" | "createdAt"> = {
      name,
      date: dateTimestamp,
      kcal: parseFloat(kcal) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fats: parseFloat(fats) || 0,
      fiber: parseFloat(fiber) || undefined,
      notes: notes || undefined,
      micronutrients: showMicronutrients && Object.keys(micronutrients).length > 0 ? micronutrients : undefined,
    }

    onSubmit(dish)
    onOpenChange(false)
  }

  const updateMicronutrient = (key: keyof Micronutrients, value: string) => {
    setMicronutrients({
      ...micronutrients,
      [key]: value ? parseFloat(value) : undefined,
    })
  }

  useEffect(() => {
    if (!dishDescription || dishDescription.length < 3) {
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsParsingDescription(true)
      try {
        const nutritionData = await parseDishDescription(dishDescription)
        if (nutritionData) {
          setName(nutritionData.name)
          setKcal(nutritionData.kcal.toString())
          setProtein(nutritionData.protein.toString())
          setCarbs(nutritionData.carbs.toString())
          setFats(nutritionData.fats.toString())
          setFiber(nutritionData.fiber?.toString() || "")
          
          if (nutritionData.micronutrients) {
            const hasMicronutrients = Object.values(nutritionData.micronutrients).some(v => v !== undefined)
            if (hasMicronutrients) {
              setMicronutrients(nutritionData.micronutrients)
              setShowMicronutrients(true)
            }
          }
        }
      } catch (error) {
      } finally {
        setIsParsingDescription(false)
      }
    }, 1500) // Wait 1.5 seconds after user stops typing

    return () => clearTimeout(timeoutId)
  }, [dishDescription])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="pb-4">
          <DialogTitle>{editingDish ? "Edit Dish" : "Add Dish"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">Describe Your Dish (AI-powered)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <textarea
                id="description"
                value={dishDescription}
                onChange={(e) => setDishDescription(e.target.value)}
                placeholder="Describe your dish in natural language...&#10;e.g., 'Grilled chicken breast with rice and steamed broccoli'&#10;or 'Pasta with tomato sauce, cheese, and basil'&#10;or 'Salmon fillet with roasted vegetables'"
                className="w-full min-h-[100px] px-9 py-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                disabled={isParsingDescription}
              />
              {isParsingDescription && (
                <div className="absolute right-3 top-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>AI is analyzing...</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              AI will automatically extract nutrition information from your description
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Dish Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Grilled Chicken Breast"
              required
              disabled={isParsingDescription}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={format(date, "yyyy-MM-dd")}
              onChange={(e) => setDate(new Date(e.target.value))}
              required
              disabled={isParsingDescription}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kcal">Calories (kcal)</Label>
              <Input
                id="kcal"
                type="number"
                step="0.1"
                value={kcal}
                onChange={(e) => setKcal(e.target.value)}
                placeholder="0"
                required
                disabled={isParsingDescription}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiber">Fiber (g)</Label>
              <Input
                id="fiber"
                type="number"
                step="0.1"
                value={fiber}
                onChange={(e) => setFiber(e.target.value)}
                placeholder="0"
                disabled={isParsingDescription}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                step="0.1"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="0"
                required
                disabled={isParsingDescription}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbs">Carbs (g)</Label>
              <Input
                id="carbs"
                type="number"
                step="0.1"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="0"
                required
                disabled={isParsingDescription}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fats">Fats (g)</Label>
              <Input
                id="fats"
                type="number"
                step="0.1"
                value={fats}
                onChange={(e) => setFats(e.target.value)}
                placeholder="0"
                required
                disabled={isParsingDescription}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              disabled={isParsingDescription}
            />
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMicronutrients(!showMicronutrients)}
              className="w-full"
            >
              {showMicronutrients ? "Hide" : "Show"} Micronutrients
            </Button>

            {showMicronutrients && (
              <div className="space-y-3 p-4 border border-border rounded-md bg-accent/5">
                <h3 className="text-sm font-semibold mb-3">Micronutrients</h3>
                <div className="grid grid-cols-2 gap-3">
                  {micronutrientFields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label htmlFor={field.key} className="text-xs">
                        {field.label} ({field.unit})
                      </Label>
                      <Input
                        id={field.key}
                        type="number"
                        step="0.01"
                        value={micronutrients[field.key]?.toString() || ""}
                        onChange={(e) => updateMicronutrient(field.key, e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingDish ? "Update" : "Add"} Dish</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

