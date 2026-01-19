import Link from "next/link"
import { GAMES_REGISTRY } from "@/lib/games-registry"
import ClassicGameClient from "./game-client"

export default async function ClassicGamePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  const gameData = GAMES_REGISTRY[params.slug as keyof typeof GAMES_REGISTRY]

  // Only allow Classic category games
  if (!gameData || gameData.category !== "Classic") {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black text-white mb-4">Game Not Found</h1>
          <Link href="/classics" className="text-emerald-500 hover:underline">
            Return to Classics
          </Link>
        </div>
      </div>
    )
  }

  return <ClassicGameClient gameData={gameData} />
}
