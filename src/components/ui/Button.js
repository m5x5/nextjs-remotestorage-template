import { cn } from "@/lib/utils"

export function Button({
  children,
  variant = "primary",
  size = "default",
  className,
  disabled,
  ...props
}) {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-semibold transition-opacity focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"

  const variants = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    secondary: "bg-muted text-foreground hover:opacity-80",
    destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
    outline: "border-2 border-dashed border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:border-muted-foreground/50",
    ghost: "hover:bg-muted text-muted-foreground hover:text-foreground",
  }

  const sizes = {
    default: "px-4 py-2 text-sm",
    sm: "px-3 py-1.5 text-xs",
    lg: "px-6 py-3 text-base",
  }

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
