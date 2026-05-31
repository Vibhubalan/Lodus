"use client";

import { useEffect, useState } from "react";
import type { Session } from "next-auth";
import { Send } from "lucide-react";
import { DiscordChatPreview } from "@/components/DiscordChatPreview";

interface Post {
  id: number;
  createdAt: string;
  content: string;
  author: {
    name: string;
    email: string;
    avatarUrl: string | null;
    role: "admin" | "member";
  };
}

type DailyPlan = {
  id: number;
  title: string;
  meetingDate: string | null;
  meetingTime: string | null;
  place: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  setByName: string;
  setByEmail: string;
  acceptCount: number;
  acceptedByMe: boolean;
};

function formatTime(iso: string) {
  const dt = new Date(iso);
  const diffMins = Math.max(0, Math.floor((Date.now() - dt.getTime()) / 60000));
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export function MemberHub({ 
  session,
  isStaff,
}: { 
  session: Session | null;
  isStaff: boolean;
}) {
  const userEmail = session?.user?.email || "";
  const [newPostText, setNewPostText] = useState("");
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [planError, setPlanError] = useState<string | null>(null);
  const [activePlanIndex, setActivePlanIndex] = useState(0);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [planForm, setPlanForm] = useState({
    title: "",
    meetingDate: "",
    meetingTime: "",
    place: "",
    notes: "",
  });
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [canCreatePlan, setCanCreatePlan] = useState(false);
  const [createdTodayByMe, setCreatedTodayByMe] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);


  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/social/posts", { cache: "no-store" });
      if (!response.ok) throw new Error("load failed");
      const data = (await response.json()) as Post[];
      setFeedPosts(Array.isArray(data) ? data : []);
      setPostError(null);
    } catch {
      setPostError("Unable to load feed right now.");
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchPosts();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const fetchDailyPlans = async () => {
    try {
      const response = await fetch("/api/schedule/daily", { cache: "no-store" });
      if (!response.ok) throw new Error("daily-plan-load-failed");
      const data = (await response.json()) as {
        plans: DailyPlan[];
        canCreatePlan?: boolean;
        createdTodayByMe?: number;
      };
      const plans = Array.isArray(data.plans) ? data.plans : [];
      setDailyPlans(plans);
      setCanCreatePlan(!!data.canCreatePlan);
      setCreatedTodayByMe(data.createdTodayByMe ?? 0);
      setActivePlanIndex((prev) => (plans.length ? Math.min(prev, plans.length - 1) : 0));
      setPlanError(null);
    } catch {
      setPlanError("Unable to load plans right now.");
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchDailyPlans();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newPostText.trim();
    if (!content) return;

    setPosting(true);
    try {
      const response = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setPostError(data.error ?? "Could not publish your post.");
        return;
      }
      setNewPostText("");
      await fetchPosts();
    } catch {
      setPostError("Could not publish your post.");
    } finally {
      setPosting(false);
    }
  };



  const activePlan = dailyPlans[activePlanIndex] ?? null;

  const showPrevPlan = () => {
    if (!dailyPlans.length) return;
    setActivePlanIndex((prev) => (prev === 0 ? dailyPlans.length - 1 : prev - 1));
  };

  const showNextPlan = () => {
    if (!dailyPlans.length) return;
    setActivePlanIndex((prev) => (prev === dailyPlans.length - 1 ? 0 : prev + 1));
  };

  const handlePlanSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStaff) return;

    const payload = {
      title: planForm.title.trim(),
      meetingDate: planForm.meetingDate.trim() || null,
      meetingTime: planForm.meetingTime.trim() || null,
      place: planForm.place.trim() || null,
      notes: planForm.notes.trim() || null,
      ...(editingPlanId ? { id: editingPlanId } : {}),
    };
    if (!payload.title) {
      setPlanError("Plan title is required.");
      return;
    }

    setIsSavingPlan(true);
    try {
      const response = await fetch("/api/schedule/daily", {
        method: editingPlanId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setPlanError(data.error ?? "Could not save plan.");
        return;
      }
      setPlanForm({ title: "", meetingDate: "", meetingTime: "", place: "", notes: "" });
      setEditingPlanId(null);
      await fetchDailyPlans();
    } catch {
      setPlanError("Could not save plan.");
    } finally {
      setIsSavingPlan(false);
    }
  };

  const startEditPlan = (plan: DailyPlan) => {
    setEditingPlanId(plan.id);
    setPlanForm({
      title: plan.title ?? "",
      meetingDate: plan.meetingDate ?? "",
      meetingTime: plan.meetingTime ?? "",
      place: plan.place ?? "",
      notes: plan.notes ?? "",
    });
  };

  const acceptPlan = async (planId: number) => {
    setIsAccepting(true);
    try {
      const response = await fetch("/api/schedule/daily/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setPlanError(data.error ?? "Could not accept plan.");
        return;
      }
      await fetchDailyPlans();
    } catch {
      setPlanError("Could not accept plan.");
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 items-start gap-6 select-none lg:grid-cols-12">
      
      {/* Left Column (Primary Social Stream) */}
      <div className="space-y-6 lg:col-span-8 xl:col-span-9">
        
        {/* Lodus Feed Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h2 className="font-tech text-2xl font-bold tracking-wider text-[#ece8ea] uppercase">
            Lodus Feed & Discussion
          </h2>
          <span className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant/50">
            Secure Member Layer
          </span>
        </div>

        {/* Minimalist Compose Box */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0d1118]/40 p-4 shadow-xl backdrop-blur-xl">
          <form onSubmit={handleCreatePost} className="space-y-3">
            <textarea
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="Post a lobby code, update, or screenshot..."
              rows={3}
              className="w-full resize-none rounded-lg bg-white/[0.01] border border-white/5 px-4 py-3 font-sans text-xs text-white placeholder-on-surface-variant/40 focus:border-[#ff4655] focus:outline-none focus:ring-1 focus:ring-[#ff4655]/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-300"
            />

            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <p className="text-[10px] text-on-surface-variant/70">Signed in as {userEmail}</p>

              <button
                type="submit"
                disabled={!newPostText.trim() || posting}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600 text-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              >
                {posting ? "Posting..." : "Post"}
                <Send className="h-3 w-3" />
              </button>
            </div>
          </form>
          {postError ? <p className="mt-2 text-[11px] text-red-300">{postError}</p> : null}
        </div>

        {/* Discussion Stream Stack */}
        <div className="space-y-4">
          {loadingPosts ? (
            <div className="rounded-xl border border-white/5 bg-[#0d1118]/20 p-5 text-xs text-on-surface-variant">
              Loading feed...
            </div>
          ) : null}
          {!loadingPosts && feedPosts.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-[#0d1118]/20 p-5 text-xs text-on-surface-variant">
              No posts yet. Share the first update with your community.
            </div>
          ) : null}
          {feedPosts.map((post) => (
            <div 
              key={post.id} 
              className="relative overflow-hidden rounded-xl border border-white/5 bg-[#0d1118]/20 p-5 shadow-lg backdrop-blur-md hover:border-white/10 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {/* User Profile Avatar */}
                  <div className="relative h-9 w-9 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <span className="font-mono text-xs font-semibold text-[#ece8ea]">
                      {(post.author.name?.slice(0, 2) || "ME").toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-on-surface">{post.author.name}</span>
                      {post.author.role === "admin" ? (
                        <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.2 rounded border border-red-500/30 bg-red-500/5 text-red-400">
                          admin
                        </span>
                      ) : null}
                    </div>
                    <span className="text-[9px] text-on-surface-variant/50">{formatTime(post.createdAt)}</span>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-on-surface-variant select-text">
                {post.content}
              </p>
            </div>
          ))}
        </div>

      </div>

      {/* Right Column (Plans Template + Roster) */}
      <div className="space-y-6 lg:col-span-4 xl:col-span-3">
        
        {/* Component A: Plans & Sessions Template */}
        <div className="border-b border-white/5 pb-2">
          <h2 className="font-tech text-2xl font-bold tracking-wider text-[#ece8ea] uppercase">
            Plans & Sessions
          </h2>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-red-500/20 bg-gradient-to-br from-[#1b0c10]/40 to-[#0d0608]/40 p-5 shadow-[0_0_24px_rgba(255,70,85,0.06)] backdrop-blur-md">
          <div className="pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full bg-primary/10 blur-xl" />
          {isStaff ? (
            <form onSubmit={handlePlanSave} className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface">Create Plan</p>
                <p className="text-[10px] text-on-surface-variant">{createdTodayByMe}/3 today</p>
              </div>
              <input
                value={planForm.title}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Title"
                className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-on-surface outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={planForm.meetingDate}
                  onChange={(e) => setPlanForm((prev) => ({ ...prev, meetingDate: e.target.value }))}
                  placeholder="Date"
                  className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-on-surface outline-none"
                />
                <input
                  value={planForm.meetingTime}
                  onChange={(e) => setPlanForm((prev) => ({ ...prev, meetingTime: e.target.value }))}
                  placeholder="Time"
                  className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-on-surface outline-none"
                />
              </div>
              <input
                value={planForm.place}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, place: e.target.value }))}
                placeholder="Place"
                className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-on-surface outline-none"
              />
              <textarea
                value={planForm.notes}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Notes"
                rows={2}
                className="w-full resize-none rounded border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-on-surface outline-none"
              />
              <button
                type="submit"
                disabled={isSavingPlan || (!editingPlanId && !canCreatePlan)}
                className="w-full rounded border border-primary/50 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-primary/10 disabled:opacity-50"
              >
                {isSavingPlan ? "Saving..." : editingPlanId ? "Update Plan" : "Add Plan"}
              </button>
            </form>
          ) : null}

          <div
            className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3"
            onTouchStart={(e) => setTouchStartX(e.changedTouches[0]?.clientX ?? null)}
            onTouchEnd={(e) => {
              const endX = e.changedTouches[0]?.clientX ?? null;
              if (touchStartX == null || endX == null) return;
              const delta = endX - touchStartX;
              if (delta > 30) showPrevPlan();
              if (delta < -30) showNextPlan();
            }}
          >
            {loadingPlans ? (
              <p className="text-xs text-on-surface-variant">Loading plans...</p>
            ) : activePlan ? (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    Plan {activePlanIndex + 1}/{dailyPlans.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={showPrevPlan}
                      className="rounded border border-white/20 px-2 py-0.5 text-[10px] text-on-surface"
                    >
                      Swipe Left
                    </button>
                    <button
                      type="button"
                      onClick={showNextPlan}
                      className="rounded border border-white/20 px-2 py-0.5 text-[10px] text-on-surface"
                    >
                      Swipe Right
                    </button>
                  </div>
                </div>
                <h3 className="font-tech text-base font-bold uppercase tracking-wider text-on-surface">
                  {activePlan.title}
                </h3>
                <p className="mt-1 text-[11px] text-on-surface-variant">
                  {(activePlan.meetingDate || "Date TBD")} {activePlan.meetingTime ? `- ${activePlan.meetingTime}` : ""}
                </p>
                <p className="text-[11px] text-on-surface-variant">{activePlan.place || "Place TBD"}</p>
                {activePlan.notes ? (
                  <p className="mt-2 text-[11px] text-on-surface-variant">{activePlan.notes}</p>
                ) : null}
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-[10px] text-on-surface-variant">
                    By {activePlan.setByName} - {activePlan.acceptCount} accepted
                  </p>
                  {isStaff ? (
                    <button
                      type="button"
                      onClick={() => startEditPlan(activePlan)}
                      className="rounded border border-white/20 px-2 py-0.5 text-[10px] text-on-surface"
                    >
                      Edit
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={isAccepting || activePlan.acceptedByMe}
                  onClick={() => acceptPlan(activePlan.id)}
                  className="mt-3 w-full rounded border border-primary/50 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-primary/10 disabled:opacity-50"
                >
                  {activePlan.acceptedByMe ? "Accepted" : isAccepting ? "Accepting..." : "Accept Plan"}
                </button>
              </>
            ) : (
              <p className="text-xs text-on-surface-variant">No plan set for today yet.</p>
            )}
            {planError ? <p className="mt-2 text-[11px] text-red-300">{planError}</p> : null}
          </div>
        </div>

        {/* Component B: Discord View + Chat */}
        <div className="border-b border-white/5 pb-2">
          <h2 className="font-tech text-2xl font-bold tracking-wider text-[#ece8ea] uppercase">
            Discord Live
          </h2>
        </div>

        <DiscordChatPreview className="min-h-[360px] h-[min(420px,50vh)]" interactive />

      </div>

    </div>
  );
}
