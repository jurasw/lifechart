import { useMemo } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Task } from "@/types/task"

interface TagFilterProps {
  tasks: Task[]
  selectedTags: string[]
  onTagToggle: (tag: string) => void
  onClearFilters: () => void
}

export const TagFilter = ({
  tasks,
  selectedTags,
  onTagToggle,
  onClearFilters,
}: TagFilterProps) => {
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    tasks.forEach((task) => {
      if (task.tags) {
        task.tags.forEach((tag) => tagSet.add(tag))
      }
    })
    return Array.from(tagSet).sort()
  }, [tasks])

  if (allTags.length === 0) {
    return null
  }

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">
          Filter by tags
        </h3>
        {selectedTags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-6 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {allTags.map((tag) => {
          const isSelected = selectedTags.includes(tag)
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onTagToggle(tag)}
              className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] sm:text-xs rounded-md border transition-colors ${
                isSelected
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-foreground border-foreground/30 hover:border-foreground/50 hover:bg-accent"
              }`}
            >
              {tag}
              {isSelected && <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

