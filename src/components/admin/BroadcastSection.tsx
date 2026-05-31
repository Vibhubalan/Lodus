import { Radio, Calendar, MonitorPlay } from "lucide-react";

export function BroadcastSection() {
  const broadcasts = [
    {
      id: 1,
      title: "Saturday Valorant Custom Lobby",
      game: "Valorant",
      host: "Marcus R.",
      platform: "Twitch",
      status: "scheduled",
      time: "Saturday at 8:00 PM EST"
    },
    {
      id: 2,
      title: "Wednesday D&D Campaign Night",
      game: "Baldur's Gate 3",
      host: "Sarah J.",
      platform: "YouTube",
      status: "scheduled",
      time: "Wednesday at 7:00 PM EST"
    },
    {
      id: 3,
      title: "Rust Server Wiped Rush",
      game: "Rust",
      host: "Mike K.",
      platform: "Twitch",
      status: "offline",
      time: "TBD"
    }
  ];

  return (
    <div className="w-full">
      {/* Header section */}
      <header className="mb-10">
        <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#ff4655] flex items-center gap-1.5">
          <Radio className="h-3.5 w-3.5 animate-pulse" />
          Lodus Broadcast System
        </span>
        <h1 className="font-tech text-5xl font-extrabold tracking-wider text-[#ece8ea] uppercase mt-1">
          Broadcasts
        </h1>
        <p className="font-mono text-[10px] text-on-surface-variant/70 uppercase tracking-wide mt-1">
          Live streams, session schedules, and streaming settings
        </p>
      </header>

      {/* Main grid content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start select-none">
        
        {/* Stream Monitor (Left Columns) */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Simulated Live Video Player */}
          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#07090d] shadow-2xl aspect-video flex flex-col items-center justify-center p-6 text-center select-none group">
            {/* Scanlines Overlay */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-5"
              style={{
                backgroundImage: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
                backgroundSize: "100% 4px, 6px 100%"
              }}
            />
            
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-radial-gradient from-transparent via-[#ff4655]/5 to-black" />
            
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-zinc-600" />
              <span className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant/60">
                SYSTEM OFFLINE
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="mx-auto rounded-full bg-red-950/20 text-[#ff4655] border border-red-500/10 p-4 w-16 h-16 flex items-center justify-center shadow-[0_0_24px_rgba(255,70,85,0.06)] group-hover:scale-105 transition-transform duration-300">
                <MonitorPlay className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-tech text-xl font-bold uppercase tracking-wider text-[#ece8ea]">
                  No Live Feeds Active
                </h3>
                <p className="font-mono text-[10px] text-on-surface-variant/70 max-w-sm mx-auto leading-relaxed">
                  Broadcast signals are dormant. Check the transmission schedule on the right to coordinate upcoming nights.
                </p>
              </div>
            </div>
          </div>

          {/* Platform accounts */}
          <div className="space-y-3">
            <span className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant/50">
              Connected Pipelines
            </span>
            <div className="grid grid-cols-2 gap-4">
               <a 
                href="https://twitch.tv" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] p-4 hover:border-white/10 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                  </svg>
                  <span className="font-sans text-xs font-semibold text-white">LodusLive</span>
                </div>
                <span className="font-mono text-[8px] uppercase tracking-wider text-purple-400 border border-purple-500/20 bg-purple-500/5 px-2 py-0.5 rounded">
                  Primary
                </span>
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] p-4 hover:border-white/10 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.524 3.545 12 3.545 12 3.545s-7.525 0-9.387.51a3.003 3.003 0 0 0-2.11 2.108C0 8.025 0 12 0 12s0 3.975.503 5.837a3.003 3.003 0 0 0 2.11 2.108c1.862.51 9.387.51 9.387.51s7.525 0 9.387-.51a3.003 3.003 0 0 0 2.11-2.108c.503-1.862.503-5.837.503-5.837s0-3.975-.503-5.837zm-14.242 9.07V8.767l6.166 3.232-6.166 3.235z"/>
                  </svg>
                  <span className="font-sans text-xs font-semibold text-white">Lodus TV</span>
                </div>
                <span className="font-mono text-[8px] uppercase tracking-wider text-on-surface-variant/40 border border-white/10 px-2 py-0.5 rounded">
                  Backup
                </span>
              </a>
            </div>
          </div>

        </div>

        {/* Schedule Sidebar (Right Column) */}
        <div className="space-y-6">
          
          <div className="border-b border-white/5 pb-2">
            <h2 className="font-tech text-2xl font-bold tracking-wider text-[#ece8ea] uppercase">
              Transmission List
            </h2>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#0d1118]/20 p-4 shadow-xl backdrop-blur-md space-y-4">
            {broadcasts.map((b) => (
              <div 
                key={b.id}
                className="flex flex-col gap-3 rounded-lg border border-white/[0.05] bg-white/[0.01] p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-tech text-xs uppercase tracking-wider text-[#ece8ea] font-semibold">
                    {b.game}
                  </span>
                  <span className={`font-mono text-[8px] uppercase tracking-widest px-2 py-0.5 rounded border ${
                    b.status === "scheduled"
                      ? "border-[#ffab40]/30 bg-[#ffab40]/5 text-[#ffab40]"
                      : "border-white/10 bg-white/5 text-on-surface-variant/60"
                  }`}>
                    {b.status}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <h4 className="font-sans text-xs font-bold text-white leading-normal">
                    {b.title}
                  </h4>
                  <p className="font-mono text-[9px] text-on-surface-variant/60">
                    Host: {b.host}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 border-t border-white/5 pt-3 font-mono text-[9px] text-on-surface-variant/70">
                  <Calendar className="h-3.5 w-3.5 text-[#ff4655]" />
                  <span>{b.time}</span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
