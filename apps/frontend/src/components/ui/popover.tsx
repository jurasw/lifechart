import * as React from "react"
import { cn } from "@/lib/utils"

interface PopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  trigger: React.ReactNode
}

const Popover = ({ open, onOpenChange, children, trigger }: PopoverProps) => {
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const [position, setPosition] = React.useState<{
    top: number
    left?: number
    right?: number
  }>({ top: 0 })

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const spacing = 8
      const padding = 16
      const estimatedPopoverWidth = 320
      const estimatedPopoverHeight = 350
      
      const wouldOverflowRight = rect.left + estimatedPopoverWidth > viewportWidth - padding
      const wouldOverflowLeft = rect.left < padding
      const wouldOverflowBottom = rect.bottom + estimatedPopoverHeight > viewportHeight - padding
      
      let left: number | undefined
      let right: number | undefined
      let top: number
      
      if (wouldOverflowRight) {
        right = Math.max(padding, viewportWidth - rect.right - spacing)
        left = undefined
      } else if (wouldOverflowLeft) {
        left = padding
        right = undefined
      } else {
        left = rect.left
        right = undefined
      }
      
      if (wouldOverflowBottom) {
        top = Math.max(padding, rect.top - estimatedPopoverHeight - spacing)
      } else {
        top = rect.bottom + spacing
      }
      
      setPosition({
        top: Math.max(padding, top),
        left,
        right,
      })
    }
  }, [open])

  return (
    <>
      <div ref={triggerRef} onClick={() => onOpenChange(!open)}>
        {trigger}
      </div>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => onOpenChange(false)}
          />
          <div
            className={cn(
              "fixed z-50 w-auto bg-popover border rounded-md shadow-md",
              "max-h-[80vh] overflow-hidden"
            )}
            style={{
              top: `${position.top}px`,
              ...(position.left !== undefined ? { left: `${position.left}px` } : {}),
              ...(position.right !== undefined ? { right: `${position.right}px` } : {}),
              maxWidth: "calc(100vw - 2rem)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </>
      )}
    </>
  )
}

export { Popover }

