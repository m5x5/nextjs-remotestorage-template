"use client"

import {
  HomeIcon,
  Cog6ToothIcon,
  CubeIcon
} from "@heroicons/react/24/outline"
import { useNavigation } from "../contexts/NavigationContext"

export function Sidebar() {
  const { activeTab, setActiveTab } = useNavigation()

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-14 flex-col border-r border-border bg-card z-40">
        {/* Logo */}
        <div className="flex h-14 items-center justify-center border-b border-border">
          <CubeIcon className="h-7 w-7 text-primary" />
        </div>

        {/* Navigation Icons */}
        <nav className="flex flex-1 flex-col items-center justify-center gap-3">
          <button
            onClick={() => setActiveTab("home")}
            className={`group rounded-lg p-2 transition-colors ${
              activeTab === "home" ? "bg-primary/10" : "hover:bg-muted"
            }`}
          >
            <HomeIcon
              className={`h-6 w-6 transition-colors ${
                activeTab === "home"
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-primary"
              }`}
            />
          </button>
        </nav>

        {/* Settings */}
        <div className="flex flex-col items-center border-t border-border py-4">
          <button
            onClick={() => setActiveTab("settings")}
            className={`group rounded-lg p-2 transition-colors ${
              activeTab === "settings" ? "bg-primary/10" : "hover:bg-muted"
            }`}
          >
            <Cog6ToothIcon
              className={`h-6 w-6 transition-colors ${
                activeTab === "settings"
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-primary"
              }`}
            />
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-card px-4 py-3 md:hidden">
        <button
          onClick={() => setActiveTab("home")}
          className={`group rounded-lg p-2 transition-colors ${
            activeTab === "home" ? "bg-primary/10" : "hover:bg-muted"
          }`}
        >
          <HomeIcon
            className={`h-6 w-6 transition-colors ${
              activeTab === "home"
                ? "text-primary"
                : "text-muted-foreground group-hover:text-primary"
            }`}
          />
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`group rounded-lg p-2 transition-colors ${
            activeTab === "settings" ? "bg-primary/10" : "hover:bg-muted"
          }`}
        >
          <Cog6ToothIcon
            className={`h-6 w-6 transition-colors ${
              activeTab === "settings"
                ? "text-primary"
                : "text-muted-foreground group-hover:text-primary"
            }`}
          />
        </button>
      </nav>
    </>
  )
}
