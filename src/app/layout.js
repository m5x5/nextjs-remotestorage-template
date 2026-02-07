"use client"
import "./globals.css"
import { RemoteStorageProvider } from "@/contexts/RemoteStorageContext"
import { ThemeProvider } from "@/components/ThemeProvider"
import { Sidebar } from "@/components/Sidebar"
import { PWARegistration } from "@/components/PWARegistration"

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="RemoteStorage App" />
        <title>Next.js RemoteStorage App</title>
        <meta name="description" content="A Next.js app with RemoteStorage integration" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen">
        <PWARegistration />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <RemoteStorageProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 pb-20 md:pb-0 md:ml-14 overflow-auto">
                <div className="mx-auto max-w-4xl p-2 sm:p-4 lg:p-6">
                  {children}
                </div>
              </main>
            </div>
          </RemoteStorageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

