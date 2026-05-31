import { PublicFooter } from "@/components/layout/PublicFooter";
import { SiteNav } from "@/components/layout/SiteNav";
import { ScrollReveal } from "@/components/layout/ScrollReveal";
import { getGamesWithMembers } from "@/lib/queries";

export const revalidate = 3600;

export default async function GamesPage() {
  const games = await getGamesWithMembers();

  return (
    <>
      <SiteNav />
      <main className="flex-grow py-12 pb-16">
        <div className="mx-auto max-w-[1200px] px-6">
          <ScrollReveal direction="up" delay={50} duration={800}>
            <header className="mb-10">
              <h1 className="text-3xl font-semibold text-on-surface">Games</h1>
              <p className="mt-2 text-on-surface-variant">
                What we have installed — find something to play together.
              </p>
            </header>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={150} duration={850}>
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
          </ScrollReveal>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
