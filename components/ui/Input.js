import { cn } from "@/lib/utils"

export function Input({ className, label, error, ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1 block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full rounded-lg border border-border bg-muted px-3 py-2 text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive focus:border-destructive",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}

export function Textarea({ className, label, error, ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1 block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "w-full rounded-lg border border-border bg-muted px-3 py-2 text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive focus:border-destructive",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
