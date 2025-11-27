import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface ErrorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message: string
}

export const ErrorDialog = ({
  open,
  onOpenChange,
  title,
  message,
}: ErrorDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="p-6">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <DialogTitle className="mb-2 text-center">{title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed whitespace-pre-line text-center">
            {message}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-4">
          <Button type="button" onClick={() => onOpenChange(false)} className="min-w-[100px]">
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

