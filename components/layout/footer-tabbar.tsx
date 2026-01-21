"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Settings } from "lucide-react"

export default function FooterTabBar() {
  const pathname = usePathname()

  // Hide tab bar on game-specific routes
  const segments = pathname.split("/").filter(Boolean)
  const isGamePage = segments.length >= 2 && (
    segments[0] === "games" || 
    segments[0] === "word-games" || 
    segments[0] === "math-games" || 
    segments[0] === "classics" || 
    segments[0] === "work-in-progress"
  )

  if (isGamePage) return null

  return (
    <footer 
      className="sticky bottom-0 z-50 bg-zinc-950/80 backdrop-blur-md border-t border-zinc-800"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <nav className="max-w-7xl mx-auto px-6 h-[50px] flex items-center" aria-label="Main navigation">
        <div className="flex items-center w-full">
          {/* Home Button */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
              pathname === "/"
                ? "text-emerald-500"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Home size={20} />
            <span className="text-xs font-bold uppercase tracking-tighter">Home</span>
          </Link>

          {/* Settings Button */}
          <Link
            href="/settings"
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
              pathname === "/settings"
                ? "text-emerald-500"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Settings size={20} />
            <span className="text-xs font-bold uppercase tracking-tighter">Settings</span>
          </Link>
        </div>
      </nav>
    </footer>
  )
}
