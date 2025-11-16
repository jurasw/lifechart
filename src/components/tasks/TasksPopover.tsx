import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover } from "@/components/ui/popover"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { TaskHistoryDialog } from "@/components/tasks/TaskHistoryDialog"
import { Search, Edit2, Trash2, List, History } from "lucide-react"
import type { Task } from "@/types/task"

interface TasksPopoverProps {
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onToggleDate: (taskId: string, date: Date) => void
}

export const TasksPopover = ({ tasks, onEdit, onDelete, onToggleDate }: TasksPopoverProps) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [historyTaskId, setHistoryTaskId] = useState<string | null>(null)

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <Popover
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) setSearchQuery("")
        }}
        trigger={
          <Button variant="outline" className="rounded-md" size="sm">
            <List className="h-4 w-4 mr-2" />
            Tasks
          </Button>
        }
      >
        <div className="space-y-2 sm:space-y-3">
          <h3 className="font-semibold text-xs sm:text-sm">All Tasks</h3>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 sm:pl-8 h-7 sm:h-8 text-xs sm:text-sm"
            />
          </div>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks yet</p>
          ) : (
            <div className="space-y-1.5 sm:space-y-2 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-1.5 sm:p-2 rounded-md hover:bg-accent gap-1.5 sm:gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm truncate">{task.title}</p>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        onEdit(task)
                        setIsOpen(false)
                      }}
                      className="h-6 w-6 sm:h-7 sm:w-7"
                    >
                      <Edit2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setHistoryTaskId(task.id)
                        setIsOpen(false)
                      }}
                      className="h-6 w-6 sm:h-7 sm:w-7"
                    >
                      <History className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setTaskToDelete(task.id)
                        setShowDeleteConfirm(true)
                      }}
                      className="h-6 w-6 sm:h-7 sm:w-7 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="Delete Task"
          description="Are you sure you want to delete this task? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => {
            if (taskToDelete) {
              onDelete(taskToDelete)
              setTaskToDelete(null)
            }
          }}
        />
      </Popover>
      <TaskHistoryDialog
        open={historyTaskId !== null}
        onOpenChange={(open) => {
          if (!open) setHistoryTaskId(null)
        }}
        task={tasks.find((t) => t.id === historyTaskId) || null}
        onToggleDate={onToggleDate}
      />
    </>
  )
}

