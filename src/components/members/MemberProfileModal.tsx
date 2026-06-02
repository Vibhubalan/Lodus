"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { SafeDisplayImage } from "@/components/ui/SafeDisplayImage";
import { useRouter } from "next/navigation";
import { X, Mail, Phone, MessageCircle, Edit, Trash2, Loader2, Calendar } from "lucide-react";
import { GameLogoDisplay, GameLogoPicker } from "@/components/members/GameLogoTiles";
import { computeAgeFromBirthdate, formatMemberAge } from "@/lib/members/age";
import { flatMemberSkills } from "@/lib/members/roster-display";
import type { RosterMember, RosterViewerMode } from "@/lib/members/roster-types";
import { adminUpdateMemberProfileFull, deleteRosterMember } from "@/app/admin/roster/actions";
import { sendPasswordResetOTP } from "@/app/profile/actions";
import { SKILL_CATALOG, SKILL_CATEGORIES, type MemberSkills } from "@/lib/members/skill-catalog";

type DB_Role = {
  id: number;
  name: string;
  slug: string;
  color: string;
};

type DB_Game = {
  id: number;
  name: string;
};

type DeckPlacement = "upper" | "lower" | "none";

function deriveDeckPlacement(member: RosterMember): DeckPlacement {
  if (member.showInLeadership) return "upper";
  if (member.showInTeam) return "lower";
  return "none";
}

export function MemberProfileModal({
  member,
  viewerMode,
  onClose,
  allRoles = [],
  allGames = [],
  canEditRoster = false,
  canDeleteMembers = false,
}: {
  member: RosterMember;
  viewerMode: RosterViewerMode;
  onClose: () => void;
  allRoles?: DB_Role[];
  allGames?: DB_Game[];
  canEditRoster?: boolean;
  canDeleteMembers?: boolean;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  // Form states
  const initialName = member.realName || member.name;
  const [name, setName] = useState(initialName);
  const [nickname, setNickname] = useState(member.nickname ?? "");
  const [email, setEmail] = useState(member.email ?? "");
  const [phone, setPhone] = useState(member.phone ?? "");
  const [bio, setBio] = useState(member.bio ?? "");
  const [designation, setDesignation] = useState(member.description ?? "");
  const [avatarUrl, setAvatarUrl] = useState(member.photoUrl ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [deckPlacement, setDeckPlacement] = useState<DeckPlacement>(
    deriveDeckPlacement(member),
  );
  const [authRoleSlug, setAuthRoleSlug] = useState(member.roleSlug ?? "member");
  const [rosterRole, setRosterRole] = useState(member.rosterRole ?? "member");
  const [selectedSkills, setSelectedSkills] = useState<MemberSkills>({
    gaming: member.skills.gaming || [],
    tech: member.skills.tech || [],
    social: member.skills.social || [],
  });
  const [selectedGames, setSelectedGames] = useState<string[]>(member.games || []);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [sendingOtp, setSendingOtp] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const displaySkills = flatMemberSkills(member.skills);
  const discordHandle = member.discord?.trim();
  const displayAge =
    member.age ?? (member.birthdate ? computeAgeFromBirthdate(member.birthdate) : null);
  const ageLabel = formatMemberAge(displayAge);

  const isDirty = 
    name !== initialName ||
    nickname !== (member.nickname ?? "") ||
    email !== (member.email ?? "") ||
    phone !== (member.phone ?? "") ||
    bio !== (member.bio ?? "") ||
    designation !== (member.description ?? "") ||
    deckPlacement !== deriveDeckPlacement(member) ||
    avatarFile !== null ||
    avatarUrl !== (member.photoUrl ?? "") ||
    authRoleSlug !== (member.roleSlug ?? "member") ||
    rosterRole !== (member.rosterRole ?? "member") ||
    JSON.stringify(selectedSkills) !== JSON.stringify(member.skills) ||
    JSON.stringify(selectedGames) !== JSON.stringify(member.games);

  const handleResetForm = () => {
    setName(initialName);
    setNickname(member.nickname ?? "");
    setEmail(member.email ?? "");
    setPhone(member.phone ?? "");
    setBio(member.bio ?? "");
    setDesignation(member.description ?? "");
    setAvatarUrl(member.photoUrl ?? "");
    setAvatarFile(null);
    setDeckPlacement(deriveDeckPlacement(member));
    setAuthRoleSlug(member.roleSlug ?? "member");
    setRosterRole(member.rosterRole ?? "member");
    setSelectedSkills({
      gaming: member.skills.gaming || [],
      tech: member.skills.tech || [],
      social: member.skills.social || [],
    });
    setSelectedGames(member.games || []);
    setError("");
    setSuccess("");
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => setMounted(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(handle);
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const handleSkillToggle = (category: keyof MemberSkills, skill: string) => {
    setSelectedSkills((prev) => {
      const list = prev[category];
      if (list.includes(skill)) {
        return { ...prev, [category]: list.filter((s) => s !== skill) };
      } else {
        return { ...prev, [category]: [...list, skill] };
      }
    });
  };

  const handleGameToggle = (gameName: string) => {
    setSelectedGames((prev) => {
      if (prev.includes(gameName)) {
        return prev.filter((g) => g !== gameName);
      } else {
        return [...prev, gameName];
      }
    });
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Display name is required.");
      return;
    }
    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }

    const formData = new FormData();
    formData.set("userId", String(member.userId));
    if (member.memberId) formData.set("memberId", String(member.memberId));
    formData.set("name", name);
    formData.set("nickname", nickname);
    formData.set("email", email);
    formData.set("phone", phone);
    formData.set("bio", bio);
    formData.set("designation", designation);
    formData.set("deckPlacement", deckPlacement);
    formData.set("avatarUrl", avatarUrl);
    if (avatarFile) formData.set("avatar", avatarFile);
    formData.set("authRoleSlug", authRoleSlug);
    formData.set("rosterRole", rosterRole);
    formData.set("skills", JSON.stringify(selectedSkills));
    formData.set("games", JSON.stringify(selectedGames));
    startTransition(async () => {
      const res = await adminUpdateMemberProfileFull(formData);
      if (!res.ok) {
        setError(res.error ?? "Failed to save profile.");
        return;
      }
      setSuccess(res.message ?? "Profile updated.");
      setIsEditing(false);
      router.refresh();
      // Keep modal open, but we need to fetch refreshed member in dynamic view. We can reload.
      setTimeout(() => {
        window.location.reload();
      }, 500);
    });
  };

  const handleSendOtp = async () => {
    setSendingOtp(true);
    setError("");
    setSuccess("");
    try {
      const res = await sendPasswordResetOTP(member.userId);
      if (!res.ok) {
        setError(res.error || "Failed to send reset email.");
      } else {
        setSuccess(
          res.message ??
            "Reset email sent. The member must sign in with the OTP, then set a new password in Profile.",
        );
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleDeleteMember = () => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const res = await deleteRosterMember(member.userId);
        if (!res.ok) {
          setError(res.error ?? "Failed to delete member.");
          return;
        }
        setShowDeleteConfirm(false);
        onClose();
        router.refresh();
        setTimeout(() => {
          window.location.reload();
        }, 300);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete member.");
      }
    });
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-profile-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
        aria-label="Close profile"
      />

      {/* Profile Card Container */}
      <div className="relative z-10 flex h-[min(90vh,680px)] w-full max-w-4xl flex-col md:flex-row overflow-hidden rounded-2xl border border-white/10 bg-[#0b0e14] shadow-2xl">
        
        {/* Left Side: Full-height portrait image */}
        <div className="relative w-full md:w-[38%] h-64 md:h-full shrink-0 overflow-hidden bg-black border-b md:border-b-0 md:border-r border-white/5">
          {isEditing ? (
            <Image
              src={avatarUrl || member.photoUrl}
              alt={name}
              fill
              className="object-cover"
              unoptimized={(avatarUrl || member.photoUrl).startsWith("http")}
            />
          ) : (
            <SafeDisplayImage
              src={avatarUrl || member.photoUrl}
              alt={name}
              fill
              className="object-cover object-center"
              unoptimized={(avatarUrl || member.photoUrl).startsWith("http")}
            />
          )}
          {/* Smooth black fades to blend into card background */}
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-r from-transparent to-[#0b0e14] hidden md:block" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0b0e14] to-transparent md:hidden" />
        </div>

        {/* Right Side: Scrollable Details & Content Area */}
        <div className="flex-1 h-full overflow-y-auto flex flex-col p-6 md:p-8 justify-between scrollbar-thin relative bg-[#0b0e14]">
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 z-30 rounded-lg border border-white/10 bg-black/40 p-2 text-on-surface hover:bg-white/10 hover:text-white transition-all"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="space-y-6">
            <div>
              <h2
                id="member-profile-title"
                className="font-tech text-3xl font-bold tracking-wide text-white uppercase"
              >
                {name}
              </h2>
              {viewerMode === "member" ? (
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-on-surface-variant/70">
                  {ageLabel ? (
                    <span className="font-mono text-on-surface-variant/80">{ageLabel} yrs</span>
                  ) : null}
                  <span
                    className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      member.presence === "online"
                        ? "bg-green-500/10 border border-green-500/20 text-green-400"
                        : member.presence === "away" || member.presence === "in_game"
                          ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                          : "bg-white/5 border border-white/10 text-on-surface-variant/60"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        member.presence === "online"
                          ? "bg-green-400"
                          : member.presence === "away" || member.presence === "in_game"
                            ? "bg-amber-400"
                            : "bg-on-surface-variant/40"
                      }`}
                    />
                    {member.presence ?? "offline"}
                  </span>
                </div>
              ) : null}
            </div>

              {/* Success / Error Notification */}
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400 font-mono">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2 text-xs text-green-400 font-mono">
                {success}
              </div>
            )}

            {/* Content view switcher */}
            {isEditing ? (
              <form onSubmit={handleSaveChanges} className="space-y-5 pb-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Card nickname
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="e.g. IGL"
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Designation / title
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Software Engineer"
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Phone number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 234 567 890"
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Homepage deck placement
                    </label>
                    <select
                      value={deckPlacement}
                      onChange={(e) => setDeckPlacement(e.target.value as DeckPlacement)}
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                    >
                      <option value="lower" className="bg-[#0b0e14]">Lower Lodus</option>
                      <option value="upper" className="bg-[#0b0e14]">Upper Lodus</option>
                      <option value="none" className="bg-[#0b0e14]">Not shown on homepage</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Auth System Role
                    </label>
                    <select
                      value={authRoleSlug}
                      onChange={(e) => setAuthRoleSlug(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                    >
                      {allRoles.map((r) => (
                        <option key={r.slug} value={r.slug} className="bg-[#0b0e14]">
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Roster Display Role
                    </label>
                    <select
                      value={rosterRole}
                      onChange={(e) => setRosterRole(e.target.value as "member" | "admin" | "owner")}
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                    >
                      <option value="member" className="bg-[#0b0e14]">Member</option>
                      <option value="admin" className="bg-[#0b0e14]">Admin</option>
                      <option value="owner" className="bg-[#0b0e14]">Owner</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Re-upload photo
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => setAvatarFile(e.currentTarget.files?.[0] ?? null)}
                    className="block w-full text-xs text-on-surface-variant file:mr-3 file:rounded file:border-0 file:bg-primary/20 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Avatar Image URL
                  </label>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    About Me / Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-red-400 block">
                    Password reset
                  </label>
                  <p className="text-[10px] text-on-surface-variant/70 leading-relaxed">
                    Sends a one-time code to the member&apos;s email. They sign in with that code,
                    then set a permanent password under Profile → Password &amp; Security.
                  </p>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp}
                    className="rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-2 text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                  >
                    {sendingOtp && <Loader2 className="h-3 w-3 animate-spin" />}
                    Send password reset email
                  </button>
                </div>

                {/* Skills Checkboxes */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                    Select Skills (Max 5 per category)
                  </label>
                  {SKILL_CATEGORIES.map((category) => (
                    <div key={category} className="space-y-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-primary block mt-1.5">
                        {category}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {SKILL_CATALOG[category].map((skill) => {
                          const isChecked = selectedSkills[category].includes(skill);
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => handleSkillToggle(category, skill)}
                              className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                                isChecked
                                  ? "bg-red-600 border-red-500 text-white"
                                  : "bg-black/25 border-white/10 text-on-surface-variant hover:border-white/20"
                              }`}
                            >
                              {skill}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                    Games played
                  </label>
                  <GameLogoPicker
                    availableNames={allGames.map((g) => g.name)}
                    selected={selectedGames}
                    onToggle={handleGameToggle}
                    disabled={pending}
                  />
                </div>

                {/* Action Buttons */}
                 <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  {canDeleteMembers ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={pending}
                      className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                    >
                      {pending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Delete Member
                    </button>
                  ) : (
                    <span />
                  )}

                  {!isDirty && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-white"
                    >
                      Close Editor
                    </button>
                  )}
                </div>

                {/* Discord-style unsaved changes floating warning bar */}
                {isDirty && (
                  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex w-[90%] max-w-xl items-center justify-between rounded-xl bg-[#111214] border border-white/5 p-3.5 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                    <span className="text-xs font-semibold text-white">
                      Careful — you have unsaved changes!
                    </span>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={handleResetForm}
                        disabled={pending}
                        className="text-xs font-semibold text-white hover:underline hover:text-white/80 transition-all"
                      >
                        Reset
                      </button>
                      <button
                        type="submit"
                        disabled={pending}
                        className="flex items-center gap-1.5 rounded bg-[#248046] hover:bg-[#1a6535] px-4 py-2 text-xs font-semibold text-white shadow-lg transition-all"
                      >
                        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}
              </form>
            ) : (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Bio text */}
                  {(bio || member.description) && (
                    <p className="text-sm leading-relaxed text-on-surface-variant/90 font-sans">
                      {bio || member.description}
                    </p>
                  )}

                  {/* Personal Info Box */}
                  {viewerMode === "member" && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.01] p-5 space-y-3.5 shadow-lg">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">Personal</h4>
                      <div className="flex flex-col gap-2.5">
                        {email && (
                          <div className="flex items-center gap-3 text-xs text-[#ece8ea]">
                            <Mail className="h-4 w-4 shrink-0 text-primary/70" />
                            <span className="font-mono">{email}</span>
                          </div>
                        )}
                        {phone && (
                          <div className="flex items-center gap-3 text-xs text-[#ece8ea]">
                            <Phone className="h-4 w-4 shrink-0 text-primary/70" />
                            <span className="font-mono">{phone}</span>
                          </div>
                        )}
                        {ageLabel ? (
                          <div className="flex items-center gap-3 text-xs text-[#ece8ea]">
                            <Calendar className="h-4 w-4 shrink-0 text-primary/70" />
                            <span className="font-mono">
                              {ageLabel} years old
                              {member.birthdate ? ` · born ${member.birthdate}` : ""}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {displaySkills.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {displaySkills.map((skill) => (
                          <span key={skill} className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-on-surface font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {member.games && member.games.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">
                        Games
                      </h4>
                      <GameLogoDisplay gameNames={member.games} />
                    </div>
                  ) : null}

                  {/* Socials */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">Socials</h4>
                    <div className="flex flex-wrap gap-3">
                      {discordHandle ? (
                        <a
                          href={`https://discord.com/users/${member.providerAccountId ?? discordHandle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 hover:bg-white/5 px-3.5 py-2 text-xs text-[#ece8ea] hover:text-white transition-colors"
                        >
                          <MessageCircle className="h-4.5 w-4.5 text-primary/70" />
                          <span>{discordHandle}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-on-surface-variant/40">No Discord handle connected.</span>
                      )}
                      {member.instagram && (
                        <a
                          href={`https://instagram.com/${member.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 hover:bg-white/5 px-3.5 py-2 text-xs text-[#ece8ea] hover:text-white transition-colors"
                        >
                          <span className="h-4.5 w-4.5 flex items-center justify-center font-bold text-primary/70 text-xs">@</span>
                          <span>{member.instagram}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit Button */}
                {canEditRoster && (
                  <div className="mt-auto pt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(true);
                        setError("");
                        setSuccess("");
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-[#1a2333] border border-white/10 hover:bg-[#253247] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit Profile
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {viewerMode === "member" ? (
            <div className="mt-8 pt-4 border-t border-white/10 text-[10px] text-on-surface-variant/40 uppercase tracking-wider">
              Community roles are assigned by owner and admin.
            </div>
          ) : null}
        </div>
      </div>

      {/* Custom Deletion Confirmation Modal Overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-red-500/25 bg-[#0e121a]/95 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-tech text-lg font-bold uppercase tracking-wider text-red-500 mb-2">
              Confirm Account Deletion
            </h3>
            <p className="text-sm leading-relaxed text-on-surface-variant mb-6">
              Are you sure you want to completely remove <strong className="text-white font-semibold">{member.name}</strong> from Lodus?
              This will permanently delete their account, profile data, and database records. This action is irreversible.
            </p>
            {error ? (
              <p className="mb-4 text-sm text-red-400" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteMember}
                disabled={pending}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-lg transition-all"
              >
                {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
