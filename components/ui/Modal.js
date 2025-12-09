"use client"

import { useEffect } from "react"
import { XMarkIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"

export function Modal({ isOpen, onClose, children, className }) {
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

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
