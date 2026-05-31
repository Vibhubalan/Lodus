"use client";

import { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, Trophy, Star } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  rating: number;
  name: string;
  tagline: string;
  wins: number;
  role: "owner" | "admin" | "member";
  bannerColor: string;
}

const LEADERBOARD_DATA: LeaderboardEntry[] = [
  {
    rank: 1,
    rating: 985,
    name: "Marcus R.",
    tagline: "Founder & Leader",
    wins: 154,
    role: "owner",
    bannerColor: "from-amber-600/20 to-red-600/10 border-amber-500/30"
  },
  {
    rank: 2,
    rating: 890,
    name: "Elena V.",
    tagline: "Operations Commander",
    wins: 122,
    role: "admin",
    bannerColor: "from-slate-400/20 to-zinc-500/10 border-slate-400/30"
  },
  {
    rank: 3,
    rating: 848,
    name: "Mike K.",
    tagline: "Rust Lord & Architect",
    wins: 105,
    role: "member",
    bannerColor: "from-amber-800/20 to-orange-700/10 border-amber-700/30"
  },
  {
    rank: 4,
    rating: 812,
    name: "Alex M.",
    tagline: "FPS Beast / Duelist",
    wins: 94,
    role: "member",
    bannerColor: "from-red-900/20 to-[#ff4655]/5 border-red-500/20"
  },
  {
    rank: 5,
    rating: 775,
    name: "Sarah J.",
    tagline: "RPG Queen & Storyteller",
    wins: 82,
    role: "member",
    bannerColor: "from-purple-900/20 to-indigo-950/10 border-purple-500/20"
  },
  {
    rank: 6,
    rating: 742,
    name: "Amina Patel",
    tagline: "Strategist & Analyst",
    wins: 68,
    role: "member",
    bannerColor: "from-cyan-900/20 to-teal-950/10 border-cyan-500/20"
  },
  {
    rank: 7,
    rating: 620,
    name: "Normal Member",
    tagline: "Lodus Recruit",
    wins: 45,
    role: "member",
    bannerColor: "from-zinc-800/30 to-zinc-900/20 border-zinc-700/20"
  },
  {
    rank: 8,
    rating: 576,
    name: "James Wilson",
    tagline: "Voice regular / Support",
    wins: 38,
    role: "member",
    bannerColor: "from-zinc-800/30 to-zinc-900/20 border-zinc-700/20"
  },
  {
    rank: 9,
    rating: 480,
    name: "David Chen",
    tagline: "Casual Strategy Gamer",
    wins: 22,
    role: "member",
    bannerColor: "from-zinc-800/30 to-zinc-900/20 border-zinc-700/20"
  }
];

export function Leaderboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter entries based on search
  const filteredEntries = useMemo(() => {
    return LEADERBOARD_DATA.filter((entry) =>
      entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tagline.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage) || 1;
  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEntries.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEntries, currentPage, itemsPerPage]);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <>
      {/* Valorant Style Header Card */}
      <header className="relative mb-10 overflow-hidden rounded-xl border border-white/5 bg-[#0d1118]/30 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-6 md:gap-0">
          <div>
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#ff4655] flex items-center gap-1.5">
              <Trophy className="h-3 w-3" />
              Lodus Competition Queue
            </span>
            <h1 className="font-tech text-5xl font-extrabold tracking-wider text-[#ece8ea] uppercase mt-1">
              Leaderboard
            </h1>
            <p className="font-mono text-[10px] text-on-surface-variant/70 uppercase tracking-wide mt-1">
              Sorted by community rating and event wins
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center justify-center px-6 py-3 rounded-lg border border-white/5 bg-white/[0.01] text-center min-w-28">
              <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/60">Season</span>
              <span className="font-tech text-xl font-bold text-[#ece8ea] mt-0.5">STAGE 01</span>
            </div>
            <div className="flex flex-col items-center justify-center px-6 py-3 rounded-lg border border-red-500/20 bg-red-950/10 text-center min-w-28 shadow-[0_0_15px_rgba(239,68,68,0.05)]">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#ff4655]">Active</span>
              <span className="font-tech text-xl font-bold text-white mt-0.5">ACT 02</span>
            </div>
          </div>
        </div>
      </header>

      {/* Leaderboard Table Container */}
      <section className="relative overflow-hidden rounded-xl border border-white/5 bg-[#0d1118]/20 shadow-xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono select-none">
            
            {/* Table Head */}
            <thead>
              <tr className="border-b border-white/5 text-on-surface-variant/60 uppercase tracking-widest text-[9px]">
                <th className="py-4 pl-6 font-bold text-center w-16">Rank</th>
                <th className="py-4 px-4 font-bold w-24">Rating</th>
                <th className="py-4 px-4 font-bold">Member</th>
                <th className="py-4 pr-6 font-bold text-right w-40">Activity</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-white/5">
              {paginatedEntries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-on-surface-variant/60 font-mono uppercase tracking-widest">
                    No members match search query
                  </td>
                </tr>
              ) : (
                paginatedEntries.map((entry) => {
                  const isTop3 = entry.rank <= 3;
                  const rankColor = 
                    entry.rank === 1 ? "text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]" :
                    entry.rank === 2 ? "text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.3)]" :
                    entry.rank === 3 ? "text-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.3)]" :
                    "text-on-surface-variant/50";

                  return (
                    <tr 
                      key={entry.rank}
                      className="group hover:bg-white/[0.02] transition-colors duration-200"
                    >
                      {/* Rank */}
                      <td className="py-4 pl-6 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className={`font-tech text-xl font-bold ${rankColor}`}>
                            {entry.rank}
                          </span>
                          {isTop3 && <Star className={`h-3 w-3 fill-current ${rankColor}`} />}
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-tech text-base font-bold text-[#ff4655] drop-shadow-[0_0_6px_rgba(255,70,85,0.2)]">
                            {entry.rating}
                          </span>
                          <span className="text-[8px] text-on-surface-variant/40">RR</span>
                        </div>
                      </td>

                      {/* Member Banner Card */}
                      <td className="py-4 px-4">
                        <div className={`flex items-center gap-3 rounded-lg border bg-gradient-to-r ${entry.bannerColor} px-4 py-2 w-full max-w-sm`}>
                          {/* Circular avatar letter */}
                          <div className="relative h-8 w-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                            <span className="font-mono text-xs font-semibold text-on-surface-variant">
                              {entry.name.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-sans text-xs font-bold text-[#ece8ea]">{entry.name}</span>
                              {entry.role !== "member" && (
                                <span className={`text-[7px] font-bold uppercase tracking-widest px-1 py-0.2 rounded border ${
                                  entry.role === "owner" 
                                    ? "border-[#ffd700]/30 bg-[#ffd700]/5 text-[#ffd700]" 
                                    : "border-red-500/30 bg-red-500/5 text-red-400"
                                }`}>
                                  {entry.role}
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-on-surface-variant/70 leading-tight">
                              {entry.tagline}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Wins / Status */}
                      <td className="py-4 pr-6 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-tech text-sm font-bold text-white tracking-wide">
                            {entry.wins} Wins
                          </span>
                          <span className="text-[8px] uppercase tracking-wider text-on-surface-variant/40">
                            Active Group Member
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Leaderboard Table Footer: Search & Pagination */}
        <footer className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-white/5 gap-4 sm:gap-0 bg-white/[0.01]">
          {/* Search inputs */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-on-surface-variant/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset page on filter change
              }}
              placeholder="Search member tag..."
              className="w-full rounded-lg bg-white/[0.01] border border-white/5 py-1.5 pl-9 pr-3 text-[11px] text-white placeholder-on-surface-variant/40 focus:border-[#ff4655] focus:outline-none transition-all duration-300"
            />
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-4">
            <span className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant/60">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="flex h-7 w-7 items-center justify-center rounded border border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02] text-on-surface transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="flex h-7 w-7 items-center justify-center rounded border border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02] text-on-surface transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </footer>
      </section>
    </>
  );
}
