import Link from "next/link"
import { GAMES_REGISTRY } from "@/lib/games-registry"
import WipGameClient from "./game-client"

export default async function WipGamePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  const gameData = GAMES_REGISTRY[params.slug as keyof typeof GAMES_REGISTRY]

  // Only allow Work In Progress category games
  if (!gameData || gameData.category !== "Work In Progress") {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black text-white mb-4">Game Not Found</h1>
          <Link href="/work-in-progress" className="text-emerald-500 hover:underline">
            Return to Work In Progress
          </Link>
        </div>
      </div>
    )
  }

  return <WipGameClient gameData={gameData} />
}
