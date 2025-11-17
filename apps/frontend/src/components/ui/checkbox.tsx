import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-input bg-transparent appearance-none cursor-pointer ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-muted checked:border-muted",
            className
          )}
          ref={ref}
          {...props}
        />
        <div className="absolute left-0 top-0 h-4 w-4 flex items-center justify-center pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity">
          <Check className="h-3.5 w-3.5 text-foreground stroke-[2.5]" />
        </div>
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }

