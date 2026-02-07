"use client"
import "./globals.css"
import { RemoteStorageProvider } from "../contexts/RemoteStorageContext"
import { NavigationProvider } from "../contexts/NavigationContext"
import { ThemeProvider } from "../components/ThemeProvider"
import { Sidebar } from "../components/Sidebar"

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Next.js RemoteStorage App</title>
        <meta name="description" content="A Next.js app with RemoteStorage integration" />
      </head>
      <body className="min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NavigationProvider>
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
          </NavigationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

