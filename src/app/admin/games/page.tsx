import { AdminNav } from "@/components/layout/AdminNav";
import { getAllMembers, getGamesWithMembers } from "@/lib/queries";
import { deleteGame, upsertGame } from "../actions";

export default async function AdminGamesPage() {
  const gamesList = await getGamesWithMembers();
  const allMembers = await getAllMembers();

  return (
    <>
      <AdminNav active="/admin/games" />
      <main className="mx-auto max-w-[960px] px-6 py-10">
        <h1 className="mb-8 text-2xl font-semibold text-on-surface">Games</h1>

        <form action={upsertGame} className="admin-card mb-8 space-y-4 p-6">
          <input name="name" placeholder="Game name" required className="w-full rounded border border-border-subtle px-3 py-2 text-sm" />
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-on-surface">Who has it</legend>
            <div className="flex flex-wrap gap-3">
              {allMembers.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="memberIds" value={m.id} />
                  {m.name}
                </label>
              ))}
            </div>
          </fieldset>
          <input type="hidden" name="sortOrder" value={gamesList.length + 1} />
          <button type="submit" className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary">Add game</button>
        </form>

        <div className="space-y-6">
          {gamesList.map((game) => (
            <form key={game.id} action={upsertGame} className="admin-card space-y-4 p-6">
              <input type="hidden" name="id" value={game.id} />
              <input name="name" defaultValue={game.name} className="w-full rounded border border-border-subtle px-3 py-2 text-sm font-medium" />
              <fieldset>
                <legend className="mb-2 text-sm text-on-surface-variant">Members</legend>
                <div className="flex flex-wrap gap-3">
                  {allMembers.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="memberIds"
                        value={m.id}
                        defaultChecked={game.members.some((gm) => gm.id === m.id)}
                      />
                      {m.name}
                    </label>
                  ))}
                </div>
              </fieldset>
              <input type="hidden" name="sortOrder" value={game.sortOrder} />
              <button type="submit" className="rounded bg-primary px-4 py-1 text-sm text-on-primary">Save</button>
            </form>
          ))}
        </div>
        <div className="mt-6 space-y-2">
          {gamesList.map((g) => (
            <form key={`del-${g.id}`} action={deleteGame.bind(null, g.id)}>
              <button type="submit" className="text-xs text-red-600 hover:underline">Delete: {g.name}</button>
            </form>
          ))}
        </div>
      </main>
    </>
  );
}
