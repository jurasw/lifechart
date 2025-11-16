import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { X } from "lucide-react"
import type { Task, TaskPeriod, DayOfWeek } from "@/types/task"

const daysOfWeek: { value: DayOfWeek; label: string }[] = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
]

interface AddTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (task: Omit<Task, "id" | "createdAt" | "completed" | "completedDates">) => void
  editingTask: Task | null
}

export const AddTaskDialog = ({
  open,
  onOpenChange,
  onSubmit,
  editingTask,
}: AddTaskDialogProps) => {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isRepetitive, setIsRepetitive] = useState(false)
  const [period, setPeriod] = useState<TaskPeriod>("daily")
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title)
      setDescription(editingTask.description)
      setIsRepetitive(editingTask.isRepetitive)
      setPeriod(editingTask.period || "daily")
      setSelectedDays(editingTask.selectedDays || [])
      setTags(editingTask.tags || [])
    } else {
      setTitle("")
      setDescription("")
      setIsRepetitive(false)
      setPeriod("daily")
      setSelectedDays([])
      setTags([])
    }
    setTagInput("")
  }, [editingTask, open])

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const addTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      isRepetitive,
      period: isRepetitive ? period : undefined,
      selectedDays:
        isRepetitive && (period === "weekly" || period === "yearly")
          ? selectedDays
          : undefined,
      tags: tags.length > 0 ? tags : undefined,
    })

    setTitle("")
    setDescription("")
    setIsRepetitive(false)
    setPeriod("daily")
    setSelectedDays([])
    setTags([])
    setTagInput("")
    onOpenChange(false)
  }

  const handleCancel = () => {
    setTitle("")
    setDescription("")
    setIsRepetitive(false)
    setPeriod("daily")
    setSelectedDays([])
    setTags([])
    setTagInput("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg font-semibold mb-1">
            {editingTask ? "Edit Task" : "Add New Task"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {editingTask
              ? "Update task details"
              : "Create a new task with optional repetition"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              className="h-9"
            />
          </div>

          <div className="flex items-center gap-2 py-1">
            <Checkbox
              id="repetitive"
              checked={isRepetitive}
              onChange={(e) => setIsRepetitive(e.target.checked)}
            />
            <Label htmlFor="repetitive" className="cursor-pointer text-sm">
              Repetitive task
            </Label>
          </div>

          {isRepetitive && (
            <div className="space-y-2">
              <Label htmlFor="period" className="text-sm font-medium">
                Period
              </Label>
              <Select
                id="period"
                value={period}
                onChange={(e) => {
                  setPeriod(e.target.value as TaskPeriod)
                  if (e.target.value !== "weekly" && e.target.value !== "yearly") {
                    setSelectedDays([])
                  }
                }}
                className="h-9"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </Select>
            </div>
          )}

          {isRepetitive && (period === "weekly" || period === "yearly") && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Days</Label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                      selectedDays.includes(day.value)
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-foreground border-input hover:bg-accent"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tags" className="text-sm font-medium">
              Tags
            </Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Add a tag and press Enter"
                className="flex-1 h-9"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addTag}
                disabled={!tagInput.trim() || tags.includes(tagInput.trim())}
                className="h-9"
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-accent rounded-md border border-foreground/20"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:opacity-70 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingTask ? "Save Changes" : "Add Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

