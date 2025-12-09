"use client"

import { createContext, useContext, useState } from "react"

const NavigationContext = createContext()

export function NavigationProvider({ children }) {
  const [activeTab, setActiveTab] = useState("home")

  return (
    <NavigationContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider")
  }
  return context
}
