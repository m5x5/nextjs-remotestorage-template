"use client"

import { useEffect, useRef, useState } from "react"
import { XMarkIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"

export function Modal({ isOpen, onClose, children, className }) {
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartY = useRef(0)
  const touchStartScroll = useRef(0)
  const touchStartElement = useRef(null)
  const sheetRef = useRef(null)
  const contentRef = useRef(null)
  const dragHandleRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  // Reset drag state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setDragY(0)
      setIsDragging(false)
    }
  }, [isOpen])

  const handleTouchStart = (e) => {
    if (!sheetRef.current) return
    
    const touch = e.touches[0]
    touchStartY.current = touch.clientY
    touchStartScroll.current = contentRef.current?.scrollTop || 0
    touchStartElement.current = e.target
    
    // Check if touch started in drag handle area
    const isInDragHandle = dragHandleRef.current?.contains(e.target) || false
    
    // Only start dragging if:
    // 1. Touch is in drag handle area, OR
    // 2. Content is scrolled to top and touch is in the top portion of the modal
    if (isInDragHandle || (touchStartScroll.current === 0 && touch.clientY < window.innerHeight * 0.3)) {
      setIsDragging(true)
    }
  }

  const handleTouchMove = (e) => {
    if (!isDragging || !sheetRef.current) return
    
    const touch = e.touches[0]
    const deltaY = touch.clientY - touchStartY.current
    const currentScroll = contentRef.current?.scrollTop || 0
    
    // If content is scrollable and user is scrolling up, don't drag
    if (deltaY < 0 && currentScroll > 0) {
      setIsDragging(false)
      setDragY(0)
      return
    }
    
    // Only allow dragging down (positive deltaY)
    if (deltaY > 0) {
      e.preventDefault() // Prevent scrolling while dragging
      setDragY(deltaY)
    } else if (deltaY < -10) {
      // User is trying to scroll up, cancel drag
      setIsDragging(false)
      setDragY(0)
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    
    const CLOSE_THRESHOLD = 100 // pixels to drag before closing
    const REDUCE_THRESHOLD = 50 // pixels to drag before reducing height
    
    if (dragY >= CLOSE_THRESHOLD) {
      // Close the modal
      onClose()
    } else if (dragY >= REDUCE_THRESHOLD) {
      // Reduce to half height (optional behavior)
      // For now, just snap back
      setDragY(0)
    } else {
      // Snap back to original position
      setDragY(0)
    }
    
    setIsDragging(false)
  }

  if (!isOpen) return null

  // Calculate backdrop opacity based on drag distance
  const backdropOpacity = isDragging 
    ? Math.max(0, 0.8 - (dragY / 300)) // Fade out as dragged down
    : (isOpen ? 0.8 : 0)

  return (
    <div
      className="fixed inset-0 z-[60] md:flex md:items-center md:justify-center"
      onClick={onClose}
    >
      <div 
        className={cn(
          "absolute inset-0 bg-background/80 backdrop-blur-sm",
          !isDragging && "transition-opacity duration-300"
        )}
        style={{
          opacity: backdropOpacity,
        }}
      />
      
      {/* Mobile: Bottom Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed inset-x-0 bottom-0 z-10 w-full rounded-t-2xl border-t border-l border-r border-border bg-card shadow-xl max-h-[90vh] overflow-hidden md:hidden",
          !isDragging && "transition-transform duration-300 ease-out",
          isOpen ? "translate-y-0" : "translate-y-full",
          className
        )}
        style={{
          transform: isDragging ? `translateY(${dragY}px)` : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle - Larger touch area */}
        <div 
          ref={dragHandleRef}
          className="flex justify-center pt-3 pb-2 touch-none select-none"
          style={{ 
            cursor: isDragging ? 'grabbing' : 'grab',
            paddingTop: '0.75rem',
            paddingBottom: '0.5rem',
            minHeight: '48px', // Larger touch target
          }}
        >
          <div 
            className={cn(
              "w-12 h-1 rounded-full transition-all duration-200",
              isDragging ? "bg-muted-foreground/50" : "bg-muted-foreground/30"
            )} 
          />
        </div>
        
        <div 
          ref={contentRef}
          className="p-6 pb-8 overflow-y-auto max-h-[calc(90vh-3rem)]"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground z-10 bg-card"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
          {children}
        </div>
      </div>

      {/* Desktop: Centered Modal */}
      <div
        className={cn(
          "hidden md:block relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl my-8 max-h-[90vh] overflow-y-auto",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground z-10 bg-card"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  )
}

export function ModalHeader({ children, className }) {
  return (
    <div className={cn("mb-4 pr-8", className)}>
      {children}
    </div>
  )
}

export function ModalTitle({ children, className }) {
  return (
    <h2 className={cn("text-2xl font-medium", className)}>
      {children}
    </h2>
  )
}

export function ModalContent({ children, className }) {
  return (
    <div className={cn("text-muted-foreground", className)}>
      {children}
    </div>
  )
}

export function ModalFooter({ children, className }) {
  return (
    <div className={cn("mt-6 flex justify-end gap-2", className)}>
      {children}
    </div>
  )
}
