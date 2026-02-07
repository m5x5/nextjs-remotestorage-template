"use client"

import { Card, CardContent } from "../ui/Card"

export default function MessageBanner({ message, messageType }) {
  if (!message) return null
  return (
    <Card
      className={`mb-6 border-2 ${
        messageType === "success"
          ? "border-success bg-success/5"
          : messageType === "error"
          ? "border-destructive bg-destructive/5"
          : "border-primary bg-primary/5"
      }`}
    >
      <CardContent className="py-3">
        <p
          className={
            messageType === "success"
              ? "text-success"
              : messageType === "error"
              ? "text-destructive"
              : "text-primary"
          }
        >
          {message}
        </p>
      </CardContent>
    </Card>
  )
}
