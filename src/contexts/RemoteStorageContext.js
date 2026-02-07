"use client"

import { createContext, useContext, useMemo } from "react"
import { useRemoteStorage } from "@/hooks/use-remote-storage"
import { useData } from "@/hooks/use-data"
import { MyModule } from "@/lib/remotestorage-module"
import RemoteStorageWidget from "@/components/RemoteStorageWidget"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { usePathname } from "next/navigation"

const RemoteStorageContext = createContext(null)

/**
 * RemoteStorageProvider using the hook-based architecture
 * Wraps your app to provide RemoteStorage functionality
 */
export function RemoteStorageProvider({ children }) {
  const pathname = usePathname()

  // Initialize RemoteStorage with your module
  const remoteStorage = useRemoteStorage({
    modules: [MyModule],
    accessClaims: {
      'mymodule': 'rw'  // Read-write access to your module
    }
  })

  // Initialize data sync
  const data = useData(remoteStorage)

  // Memoize context value to prevent unnecessary rerenders
  const value = useMemo(() => ({
    // RemoteStorage instance
    remoteStorage,

    // Connection state
    isConnected: data.isConnected,
    isLoading: data.isLoading,

    // Data and methods from useData hook
    ...data,

    // Cleanup function
    cleanupDuplicates: async () => {
      if (remoteStorage?.mymodule) {
        return await remoteStorage.mymodule.cleanupDuplicatesByTitle()
      }
      return { removed: 0, kept: 0 }
    }
  }), [remoteStorage, data])

  return (
    <RemoteStorageContext.Provider value={value}>
      {children}
      {/* Widget for connecting to RemoteStorage - only show on settings page */}
      {remoteStorage && pathname === "/settings" && (
        <div className="fixed bottom-5 right-5 z-[1000] w-full max-w-sm px-4 md:px-0 md:max-w-[22rem]">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Storage connection</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <RemoteStorageWidget remoteStorage={remoteStorage} embedded />
            </CardContent>
          </Card>
        </div>
      )}
    </RemoteStorageContext.Provider>
  )
}

/**
 * Hook to access RemoteStorage context
 * @returns {Object} RemoteStorage context value
 */
export function useRemoteStorageContext() {
  const context = useContext(RemoteStorageContext)
  if (!context) {
    throw new Error("useRemoteStorageContext must be used within a RemoteStorageProvider")
  }
  return context
}

