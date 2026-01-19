"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Settings } from "lucide-react"

export default function FooterTabBar() {
  const pathname = usePathname()

  return (
    <footer 
      className="sticky bottom-0 z-50 bg-zinc-950/80 backdrop-blur-md border-t border-zinc-800"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <nav className="max-w-7xl mx-auto px-6 py-3" aria-label="Main navigation">
        <div className="flex items-center justify-around">
          {/* Home Button */}
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors ${
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
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors ${
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
