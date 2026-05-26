import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNav } from "@/components/layout/PublicNav";
import { getGamesWithMembers } from "@/lib/queries";

export default async function GamesPage() {
  const games = await getGamesWithMembers();

  return (
    <>
      <PublicNav />
      <main className="flex-grow pb-16 pt-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <header className="mb-10">
            <h1 className="text-3xl font-semibold text-on-surface">Games</h1>
            <p className="mt-2 text-on-surface-variant">
              What we have installed — find something to play together.
            </p>
          </header>
          <div className="glass-card overflow-hidden rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-outline-variant/40 bg-surface-container/50">
                <tr>
                  <th className="px-6 py-3 font-medium text-on-surface-variant">Game</th>
                  <th className="px-6 py-3 font-medium text-on-surface-variant">Members</th>
                </tr>
              </thead>
              <tbody>
                {games.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-on-surface-variant">
                      No games listed yet.
                    </td>
                  </tr>
                ) : (
                  games.map((game) => (
                    <tr
                      key={game.id}
                      className="border-b border-outline-variant/20 last:border-0 hover:bg-primary-container/20"
                    >
                      <td className="px-6 py-4 font-medium text-on-surface">{game.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {game.members.length === 0 ? (
                            <span className="text-on-surface-variant">—</span>
                          ) : (
                            game.members.map((m) => (
                              <span
                                key={m.id}
                                className="rounded bg-surface-container-high px-2 py-0.5 text-xs text-on-surface"
                              >
                                {m.name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
