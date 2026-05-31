"use client";

import { Lock, Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type VoiceUser = {
  id: string;
  username: string;
  avatarUrl: string | null;
};

type VoiceChannel = {
  id: string;
  name: string;
  isLocked: boolean;
  joinUrl: string | null;
  users: VoiceUser[];
};

export function DiscordVoicePreview({ className = "" }: { className?: string }) {
  const [channels, setChannels] = useState<VoiceChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackerPending, setTrackerPending] = useState(false);
  const MAX_CHANNEL_BLOCKS = 4;

  useEffect(() => {
    let active = true;

    const fetchVoice = async () => {
      try {
        const response = await fetch("/api/discord/voice", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as VoiceChannel[];
        const pending = response.headers.get("X-Voice-Tracker-Ready") === "0";
        if (active) {
          setChannels(Array.isArray(data) ? data : []);
          setTrackerPending(pending);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchVoice();
    const intervalId = setInterval(fetchVoice, 5_000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  const visibleChannels = useMemo(
    () => channels.slice(0, MAX_CHANNEL_BLOCKS),
    [channels],
  );
  const placeholderCount = Math.max(0, MAX_CHANNEL_BLOCKS - visibleChannels.length);

  if ((loading || trackerPending) && channels.length === 0) {
    return (
      <div className={`glass-card rounded-xl p-4 md:p-5 ${className}`}>
        <p className="text-xs text-on-surface-variant">
          {trackerPending ? "Connecting to Discord voice…" : "Checking voice activity…"}
        </p>
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className={`glass-card rounded-xl p-4 md:p-5 ${className}`}>
        <p className="text-xs text-on-surface-variant">No voice channels configured</p>
      </div>
    );
  }

  return (
    <div className={`glass-card rounded-xl p-3 sm:p-4 ${className}`}>
      <div className="h-full space-y-2 overflow-hidden pb-1">
        {visibleChannels.map((channel) => {
          const visibleUsers = channel.users.slice(0, 3);
          const remaining = Math.max(0, channel.users.length - 3);
          const Wrapper = channel.joinUrl ? "a" : "article";
          const wrapperProps = channel.joinUrl
            ? {
                href: channel.joinUrl,
                target: "_blank",
                rel: "noreferrer",
              }
            : {};

          return (
            <Wrapper
              key={channel.id}
              {...wrapperProps}
              className="block rounded-lg border border-white/8 bg-[#0b0709]/70 p-2.5 transition-colors hover:border-primary/30 sm:p-3"
            >
              <div className="mb-2 flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-primary" />
                <p className="truncate text-xs font-semibold text-on-surface">{channel.name}</p>
                {channel.isLocked ? (
                  <Lock className="h-3.5 w-3.5 text-on-surface-variant" />
                ) : null}
              </div>

              {channel.users.length > 0 ? (
                <div className="flex items-center -space-x-2">
                  {visibleUsers.map((user) => {
                    const fallbackInitial = (user.username?.[0] || "U").toUpperCase();
                    return user.avatarUrl ? (
                      <img
                        key={user.id}
                        src={user.avatarUrl}
                        alt={user.username}
                        title={user.username}
                        className="h-7 w-7 rounded-full border border-white/15 object-cover"
                      />
                    ) : (
                      <div
                        key={user.id}
                        title={user.username}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-primary-container text-[10px] font-semibold text-on-surface"
                      >
                        {fallbackInitial}
                      </div>
                    );
                  })}

                  {remaining > 0 ? (
                    <div className="ml-2 rounded-full border border-white/15 bg-black/30 px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant">
                      +{remaining}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="text-[11px] text-on-surface-variant">
                  No one connected
                </div>
              )}

              {channel.joinUrl ? (
                <div className="mt-1 h-2" />
              ) : (
                <div className="mt-1 text-[10px] uppercase tracking-wider text-on-surface-variant">
                  No invite configured
                </div>
              )}
            </Wrapper>
          );
        })}

        {Array.from({ length: placeholderCount }).map((_, index) => (
          <article
            key={`voice-placeholder-${index}`}
            className="rounded-lg border border-dashed border-white/12 bg-[#0b0709]/35 p-2.5 sm:p-3"
          >
            <div className="mb-2 flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-on-surface-variant/60" />
              <p className="truncate text-xs font-semibold text-on-surface-variant">
                Empty slot
              </p>
            </div>
            <div className="text-[11px] text-on-surface-variant/70">No channel in this slot</div>
          </article>
        ))}
      </div>
    </div>
  );
}

