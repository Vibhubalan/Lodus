/** Trending games — UI logos (expand list later). Names must match DB `games.name`. */
export type GameCatalogEntry = {
  name: string;
  logoUrl: string;
  accent: string;
};

export const TRENDING_GAMES: GameCatalogEntry[] = [
  { name: "Valorant", logoUrl: "/images/games/valorant.svg", accent: "#ff4655" },
  { name: "Minecraft", logoUrl: "/images/games/minecraft.svg", accent: "#62b47a" },
  { name: "Rust", logoUrl: "/images/games/rust.svg", accent: "#cd412b" },
  { name: "Baldur's Gate 3", logoUrl: "/images/games/baldurs-gate-3.svg", accent: "#c9a227" },
  { name: "Helldivers 2", logoUrl: "/images/games/helldivers-2.svg", accent: "#f5c518" },
  { name: "Fortnite", logoUrl: "/images/games/fortnite.svg", accent: "#1da1f2" },
];

const byName = new Map(
  TRENDING_GAMES.map((g) => [g.name.toLowerCase(), g] as const),
);

export function resolveGameCatalogEntry(gameName: string): GameCatalogEntry | null {
  return byName.get(gameName.trim().toLowerCase()) ?? null;
}

export function resolveGameLogoUrl(gameName: string): string {
  return resolveGameCatalogEntry(gameName)?.logoUrl ?? "/images/games/default.svg";
}
