"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { GAMES_REGISTRY } from "@/lib/games-registry"

// Map route segments to display names
const ROUTE_METADATA: Record<string, { label: string }> = {
  "word-games": { label: "Word Games" },
  "classics": { label: "Classic Games" },
  "work-in-progress": { label: "Work In Progress" },
  "settings": { label: "Settings" },
  "games": { label: "Games" },
}

export default function Breadcrumbs() {
  const pathname = usePathname()
  
  // Parse pathname into segments
  const segments = pathname.split("/").filter(Boolean)
  
  // Get current page title (could be a game name from registry)
  const currentPageTitle = (() => {
    if (pathname === "/") return "Dashboard"
    
    const lastSegment = segments[segments.length - 1]
    if (!lastSegment) return "Dashboard"
    
    // Check if it's a game slug
    const gameData = GAMES_REGISTRY[lastSegment as keyof typeof GAMES_REGISTRY]
    if (gameData) return gameData.title
    
    // Check route metadata
    const metadata = ROUTE_METADATA[lastSegment]
    if (metadata) return metadata.label
    
    // Fallback to formatted segment
    return lastSegment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  })()

  // Build breadcrumb items
  const items = pathname === "/" 
    ? [{ label: "Home", href: "/" }]
    : [
        { label: "Home", href: "/" },
        ...segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/")
          const metadata = ROUTE_METADATA[segment]
          const label = metadata?.label || segment
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
          return { label, href }
        }),
      ]

  return (
    <header 
      className="sticky top-0 z-50 bg-zinc-950 border-b border-zinc-800"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <nav className="max-w-7xl mx-auto px-6 py-3" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm">
          {items.map((item, index) => {
            const isLast = index === items.length - 1
            const isHome = pathname === "/"
            return (
              <li key={item.href} className="flex items-center gap-2">
                {index === 0 ? (
                  <Link
                    href={item.href}
                    className={isHome ? "text-white" : "text-zinc-400 hover:text-emerald-500 transition-colors"}
                  >
                    <span className="text-xl font-black italic tracking-tighter uppercase leading-none">
                      Game<span className="text-emerald-500">Hub</span>
                    </span>
                  </Link>
                ) : (
                  <>
                    <span className="text-zinc-600">/</span>
                    {isLast ? (
                      <span className="text-white font-medium">{currentPageTitle}</span>
                    ) : (
                      <Link
                        href={item.href}
                        className="text-zinc-400 hover:text-white transition-colors"
                      >
                        {item.label}
                      </Link>
                    )}
                  </>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </header>
  )
}
