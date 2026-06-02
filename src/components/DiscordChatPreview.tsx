"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useSession } from "next-auth/react";
import { getDiscordPollIntervalMs } from "@/lib/client/device-perf";
import { useInViewportPolling } from "@/lib/client/use-in-viewport-polling";
import { useLightAnimations } from "@/lib/client/use-light-animations";
import { isMemberAuthEnabled } from "@/lib/features";

type ChatMessage = {
  id: string;
  content: string;
  timestamp: string;
  author: {
    id: string;
    username: string;
    avatar: string | null;
  };
};

function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function getAvatarUrl(authorId: string, avatarHash: string | null) {
  if (!avatarHash) return null;
  return `https://cdn.discordapp.com/avatars/${authorId}/${avatarHash}.png`;
}

export function DiscordChatPreview({
  className = "",
  interactive = false,
}: {
  className?: string;
  interactive?: boolean;
}) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isDiscordLinked, setIsDiscordLinked] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);
  const paneRef = useRef<HTMLDivElement>(null);

  const canSend = interactive && !!session?.user && isDiscordLinked;
  const light = useLightAnimations();
  const sectionVisible = useInViewportPolling("discord");
  const pollMs = getDiscordPollIntervalMs("chat", interactive);

  useEffect(() => {
    const el = paneRef.current;
    if (!el) return;

    const GAP_PX = 8;
    const ROW_PX = 80;

    const updateCapacity = () => {
      const height = el.clientHeight;
      if (height <= 0) return;
      const count = Math.floor((height + GAP_PX) / (ROW_PX + GAP_PX));
      setVisibleCount(Math.max(1, count));
    };

    updateCapacity();
    const observer = new ResizeObserver(updateCapacity);
    observer.observe(el);

    return () => observer.disconnect();
  }, [interactive]);

  useEffect(() => {
    if (!sectionVisible) return;

    let active = true;

    const fetchMessages = async () => {
      try {
        const response = await fetch("/api/discord/messages", { cache: "no-store" });
        if (!response.ok) throw new Error("read-failed");
        const data = (await response.json()) as ChatMessage[];
        if (active) {
          setMessages(Array.isArray(data) ? data : []);
          setLoadError(null);
        }
      } catch {
        if (active) setLoadError("Chat unavailable right now.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchMessages();
    const intervalId = window.setInterval(() => void fetchMessages(), pollMs);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [pollMs, sectionVisible, light]);

  useEffect(() => {
    if (!interactive) return;
    let active = true;

    const checkLink = async () => {
      if (!session?.user) {
        setIsDiscordLinked(false);
        return;
      }
      try {
        const res = await fetch("/api/profile/discord-link", { cache: "no-store" });
        if (!res.ok) throw new Error("link-check-failed");
        const data = (await res.json()) as { linked: boolean };
        if (active) setIsDiscordLinked(!!data.linked);
      } catch {
        if (active) setIsDiscordLinked(false);
      }
    };

    checkLink();
    return () => {
      active = false;
    };
  }, [interactive, session?.user]);

  const hasMessages = useMemo(() => messages.length > 0, [messages]);
  const visibleMessages = useMemo(
    () => (messages.length > visibleCount ? messages.slice(-visibleCount) : messages),
    [messages, visibleCount],
  );

  const sendMessage = async () => {
    const message = draft.trim();
    if (!message || !canSend || isSending) return;

    setIsSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/discord/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setSendError(data.error ?? "Unable to send message.");
        return;
      }
      setDraft("");
    } catch {
      setSendError("Unable to send message.");
    } finally {
      setIsSending(false);
    }
  };

  const composer = interactive && isMemberAuthEnabled() ? (
    <div className="shrink-0 border-t border-white/10 pt-2">
      {!session?.user ? (
        <a
          href="/login"
          className="block rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-white hover:bg-primary/20"
        >
          Log in to chat
        </a>
      ) : !isDiscordLinked ? (
        <a
          href="/profile?section=security"
          className="block rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-white hover:bg-primary/20"
        >
          Link Discord in Security to chat
        </a>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Type a message..."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-on-surface outline-none focus:border-primary/70"
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={isSending || !draft.trim()}
              className="rounded-lg bg-primary px-3 py-2 text-white disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          {sendError ? <p className="text-[10px] text-red-300">{sendError}</p> : null}
        </div>
      )}
    </div>
  ) : null;

  const shellClass = `glass-card flex h-full min-h-0 flex-col rounded-xl p-3 sm:p-4 ${className}`;

  if (loading && !hasMessages) {
    return (
      <div className={shellClass}>
        <p className="text-xs text-on-surface-variant">Loading recent chat...</p>
        {composer}
      </div>
    );
  }

  if (!hasMessages && !loadError) {
    return (
      <div className={shellClass}>
        <p className="text-xs text-on-surface-variant">No messages in this channel yet</p>
        {composer}
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <div
        ref={paneRef}
        className="flex min-h-0 flex-1 flex-col justify-end gap-2 overflow-hidden"
      >
        {loadError ? <p className="shrink-0 text-xs text-on-surface-variant">{loadError}</p> : null}
        {visibleMessages.map((message) => {
            const avatarSrc = getAvatarUrl(message.author.id, message.author.avatar);
            const fallbackInitial = (message.author.username?.[0] || "U").toUpperCase();

            return (
              <article
                key={message.id}
                className="shrink-0 rounded-lg border border-white/8 bg-[#0b0709]/70 p-2.5 sm:p-3"
              >
                <div className="mb-1 flex items-center gap-2">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={message.author.username}
                      className="h-7 w-7 rounded-full border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-primary-container text-[10px] font-semibold text-on-surface">
                      {fallbackInitial}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-on-surface">
                      {message.author.username}
                    </p>
                    <p className="text-[10px] text-on-surface-variant">
                      {formatRelativeTime(message.timestamp)}
                    </p>
                  </div>
                </div>
                <p className="wrap-break-word line-clamp-3 break-all whitespace-pre-wrap text-xs leading-relaxed text-on-surface-variant">
                  {message.content}
                </p>
              </article>
            );
        })}
      </div>
      {composer}
    </div>
  );
}
