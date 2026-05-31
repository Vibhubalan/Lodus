"use client";

import Image from "next/image";
import { TRENDING_GAMES, resolveGameCatalogEntry, resolveGameLogoUrl } from "@/lib/games/game-catalog";
import { cn } from "@/lib/utils";

function GameLogo({
  gameName,
  size = 56,
  className = "",
}: {
  gameName: string;
  size?: number;
  className?: string;
}) {
  const entry = resolveGameCatalogEntry(gameName);
  const logoUrl = resolveGameLogoUrl(gameName);
  const accent = entry?.accent ?? "#ff4655";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/50 p-1.5",
        className,
      )}
      style={{ width: size, height: size, boxShadow: `0 0 0 1px ${accent}22` }}
      title={gameName}
    >
      <Image
        src={logoUrl}
        alt={gameName}
        width={size - 12}
        height={size - 12}
        className="h-auto w-auto max-h-full max-w-full object-contain"
        unoptimized
      />
    </div>
  );
}

/** Read-only row of game logos for profiles */
export function GameLogoDisplay({ gameNames }: { gameNames: string[] }) {
  if (gameNames.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {gameNames.map((name) => (
        <GameLogo key={name} gameName={name} size={52} />
      ))}
    </div>
  );
}

/** Admin/editor grid — pick games by logo */
export function GameLogoPicker({
  availableNames,
  selected,
  onToggle,
  disabled = false,
}: {
  availableNames: string[];
  selected: string[];
  onToggle: (gameName: string) => void;
  disabled?: boolean;
}) {
  const names = new Set(
    [...TRENDING_GAMES.map((g) => g.name), ...availableNames].filter(Boolean),
  );

  return (
    <div className="flex flex-wrap gap-3">
      {[...names].map((name) => {
        const isOn = selected.includes(name);
        const entry = resolveGameCatalogEntry(name);
        const logoUrl = resolveGameLogoUrl(name);
        const accent = entry?.accent ?? "#ff4655";

        return (
          <button
            key={name}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(name)}
            title={name}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg p-1 transition-all focus:outline-none focus-visible:outline-none",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            <span
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-lg border bg-black/40 p-2 transition-all",
                isOn ? "border-primary/80" : "border-white/10 hover:border-white/30",
              )}
              style={isOn ? { boxShadow: `0 0 12px ${accent}44` } : undefined}
            >
              <Image
                src={logoUrl}
                alt={name}
                width={40}
                height={40}
                className="max-h-full max-w-full object-contain"
                unoptimized
              />
            </span>
            <span className="max-w-[72px] truncate text-[9px] font-semibold uppercase tracking-wide text-on-surface-variant">
              {name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
