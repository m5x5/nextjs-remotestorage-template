"use client"

import { useRemoteStorageContext } from "@/contexts/RemoteStorageContext"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import Link from "next/link"
import { ArrowRightIcon, ClockIcon } from "@heroicons/react/24/outline"

function formatSavedAt(iso) {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, {
    dateStyle: "medium",
  })
}

export default function HistoryPage() {
  const { isConnected, savedWeeks } = useRemoteStorageContext()

  if (!isConnected) {
    return (
      <div className="py-8">
        <h1 className="text-3xl font-bold mb-6">Week history</h1>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Connect to RemoteStorage to view your saved weeks.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6">Week history</h1>
      <p className="text-muted-foreground mb-6">
        Saved weeks from Home. Click one to view it or copy it to the current week.
      </p>

      {savedWeeks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <ClockIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No saved weeks yet. On Home, add recipes to &quot;This week&quot; and click &quot;Save this week&quot; to build history.
            </p>
            <Link href="/" className="inline-block mt-4">
              <span className="text-primary font-medium hover:underline">Go to Home</span>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {savedWeeks.map((week) => (
            <li key={week.id}>
              <Link
                href={`/history/${week.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground">
                    {week.label || formatSavedAt(week.savedAt) || "Saved week"}
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {week.savedAt && (
                      <span>{formatSavedAt(week.savedAt)}</span>
                    )}
                    {week.recipeIds?.length != null && week.recipeIds.length > 0 && (
                      <span className="ml-2">
                        · {week.recipeIds.length} recipe{week.recipeIds.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-muted-foreground shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
