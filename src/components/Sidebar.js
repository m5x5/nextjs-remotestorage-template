"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  HomeIcon,
  Cog6ToothIcon,
  CubeIcon,
  ShoppingCartIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline"

function NavLink({ href, isActive, icon: Icon, title }) {
  return (
    <Link
      href={href}
      className={`group rounded-lg p-2 transition-colors ${
        isActive ? "bg-primary/10" : "hover:bg-muted"
      }`}
      title={title}
    >
      <Icon
        className={`h-6 w-6 transition-colors ${
          isActive
            ? "text-primary"
            : "text-muted-foreground group-hover:text-primary"
        }`}
      />
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()

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
          <NavLink href="/" isActive={pathname === "/"} icon={HomeIcon} title="Home" />
          <NavLink href="/ingredients" isActive={pathname === "/ingredients"} icon={ShoppingCartIcon} title="Ingredients" />
          <NavLink href="/optimize" isActive={pathname === "/optimize"} icon={ChartBarIcon} title="Optimize week" />
        </nav>

        {/* Settings */}
        <div className="flex flex-col items-center border-t border-border py-4">
          <NavLink href="/settings" isActive={pathname === "/settings"} icon={Cog6ToothIcon} title="Settings" />
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-card px-4 py-3 md:hidden">
        <NavLink href="/" isActive={pathname === "/"} icon={HomeIcon} title="Home" />
        <NavLink href="/ingredients" isActive={pathname === "/ingredients"} icon={ShoppingCartIcon} title="Ingredients" />
        <NavLink href="/optimize" isActive={pathname === "/optimize"} icon={ChartBarIcon} title="Optimize week" />
        <NavLink href="/settings" isActive={pathname === "/settings"} icon={Cog6ToothIcon} title="Settings" />
      </nav>
    </>
  )
}
