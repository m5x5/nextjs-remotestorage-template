import { cn } from "@/lib/utils"

export function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 text-card-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3 className={cn("text-xl font-semibold", className)} {...props}>
      {children}
    </h3>
  )
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  )
}
