/**
 * Game Icons - Maps icon names to Lucide React icons
 */

import {
  TreePine,
  Brain,
  Zap,
  Boxes,
  Fish,
  Grid3x3,
  FileText,
  Gamepad2,
  Target,
  Dice6,
  PartyPopper,
  Palette,
  Theater,
  Guitar,
  Music4,
  Calculator,
  Puzzle,
  type LucideIcon,
} from "lucide-react"

const iconMap: Record<string, LucideIcon> = {
  TreePine,
  Brain,
  Zap,
  Boxes,
  Fish,
  Grid3x3,
  FileText,
  Gamepad2,
  Target,
  Dice6,
  PartyPopper,
  Palette,
  Theater,
  Guitar,
  Music4,
  Calculator,
  Puzzle,
}

export function getGameIcon(iconName: string): LucideIcon {
  return iconMap[iconName] || FileText
}

export function GameIcon({ iconName, size = 80, className }: { iconName: string; size?: number; className?: string }) {
  const Icon = getGameIcon(iconName)
  return <Icon size={size} className={className} />
}
