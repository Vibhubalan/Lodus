"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { PasswordResetForm } from "@/components/profile/PasswordResetForm";
import {
  deleteAccount,
  disconnectDiscord,
  updatePersonalProfile,
  updateProfileAvatar,
} from "@/app/profile/actions";
import { ProfileSkillsSection } from "@/components/profile/ProfileSkillsSection";
import type { MemberSkills } from "@/lib/members/skill-catalog";

export type ProfileSection = "account" | "delete";

export type ProfileData = {
  userId: number;
  email: string;
  name: string | null;
  phone: string | null;
  phoneVerified: boolean;
  emailVerified: boolean;
  avatarUrl: string | null;
  discord: string | null;
  discordLinked: boolean;
  authProvider: string;
  instagram: string | null;
  linkedin: string | null;
  nickname: string | null;
  roleSlug: string | null;
  roleName: string | null;
  roleColor: string | null;
  skills: MemberSkills;
  canEditNickname: boolean;
  hasCustomPassword: boolean;
};

// Brand SVGs
const DiscordIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 127.14 96.36" fill="currentColor" {...props}>
    <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,52.8,6.83,77.19,77.19,0,0,0,49.5,0,105.15,105.15,0,0,0,19.06,8.07C3.82,30.56-4,52.48,2.42,73.89a105.81,105.81,0,0,0,32,16.09,79,79,0,0,0,6.77-11,68.7,68.7,0,0,1-10.64-5.12c.91-.67,1.81-1.37,2.67-2.1a75.44,75.44,0,0,0,84.4,0c.87.73,1.76,1.43,2.68,2.1a68.86,68.86,0,0,1-10.65,5.13,79.08,79.08,0,0,0,6.77,11,105.9,105.9,0,0,0,32-16.09C130.82,52.48,122.56,30.56,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export function ProfileSettings({
  profile,
  initialSection = "account",
}: {
  profile: ProfileData;
  initialSection?: ProfileSection | "personal" | "security";
}) {
  const mappedSection: ProfileSection = 
    initialSection === "delete" ? "delete" : "account";

  const router = useRouter();
  const searchParams = useSearchParams();
  const [section, setSection] = useState<ProfileSection>(mappedSection);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [discordLinked, setDiscordLinked] = useState(profile.discordLinked);
  const [discordHandle, setDiscordHandle] = useState(profile.discord);

  useEffect(() => {
    setDiscordLinked(profile.discordLinked);
    setDiscordHandle(profile.discord);
  }, [profile.discordLinked, profile.discord]);

  const oauthFeedbackHandled = useRef(false);

  useEffect(() => {
    const discord = searchParams.get("discord");
    const err = searchParams.get("error");
    if (!discord && !err) {
      oauthFeedbackHandled.current = false;
      return;
    }
    if (oauthFeedbackHandled.current) return;
    oauthFeedbackHandled.current = true;

    if (discord === "linked") {
      setMessage("Discord account linked successfully.");
      setError("");
      setDiscordLinked(true);
      router.refresh();
    } else if (err) {
      const messages: Record<string, string> = {
        DiscordAlreadyLinked:
          "This Discord account is still tied to another active Lodus member. If you deleted that profile, try again now — or ask an admin to release the link.",
        DiscordLinkExpired: "The link request expired. Please try connecting again.",
        DiscordLinkDenied: "Discord authorization was cancelled.",
        DiscordLinkInvalid: "Invalid Discord link response. Please try again.",
        DiscordLinkFailed: "Could not complete Discord linking. Please try again.",
        DiscordLinkSessionMismatch:
          "Session changed during linking. Stay signed in as the same account and try again.",
        DiscordNotConfigured: "Discord linking is not configured on this server.",
      };
      setError(messages[err] ?? "Discord linking failed. Please try again.");
      setMessage("");
    }

    // Strip ?error= / ?discord= from the URL so refresh doesn't re-show banners or shift layout.
    router.replace("/profile", { scroll: false });
  }, [searchParams, router]);

  // Modals state
  const [activeModal, setActiveModal] = useState<
    "name" | "nickname" | "phone" | "password" | "instagram" | "linkedin" | "avatar" | null
  >(null);

  // Modal edit fields
  const [tempName, setTempName] = useState(profile.name ?? "");
  const [tempNickname, setTempNickname] = useState(profile.nickname ?? "");
  const [tempPhone, setTempPhone] = useState(profile.phone ?? "");
  const [tempInstagram, setTempInstagram] = useState(profile.instagram ?? "");
  const [tempLinkedin, setTempLinkedin] = useState(profile.linkedin ? profile.linkedin : "https://www.linkedin.com/in/");
  
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reveal mask controls - Swapped eye behavior:
  // Hidden shows slashed eye (EyeOff) -> clicking reveals.
  // Visible shows open eye (Eye) -> clicking hides.
  const [revealEmail, setRevealEmail] = useState(false);
  const [revealPhone, setRevealPhone] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarSrc =
    avatarPreview ?? profile.avatarUrl ?? "/images/about/lodus-photo.png";


  // Mask helper functions
  const maskEmail = (email: string) => {
    if (!email) return "";
    const [name, domain] = email.split("@");
    if (!name || !domain) return email;
    if (name.length <= 2) return `${name[0]}***@${domain}`;
    return `${name[0]}${"*".repeat(name.length - 2)}${name[name.length - 1]}@${domain}`;
  };

  const maskPhone = (phone: string) => {
    if (!phone) return "";
    if (phone.length <= 4) return "****";
    return "*".repeat(phone.length - 4) + phone.slice(-4);
  };

  const statusBanner = useMemo(() => {
    if (error) {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300 animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      );
    }
    if (message) {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/25 bg-green-500/10 px-4 py-3 text-sm text-green-300 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {message}
        </div>
      );
    }
    return null;
  }, [error, message]);

  function clearAlerts() {
    setError("");
    setMessage("");
  }

  function runAction(
    action: () => Promise<{
      ok: boolean;
      error?: string;
      message?: string;
      avatarUrl?: string;
    }>,
  ) {
    clearAlerts();
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) {
          setError(result.error ?? "Something went wrong.");
          return;
        }
        if (result.avatarUrl) {
          setAvatarPreview(result.avatarUrl);
        }
        setMessage(result.message ?? "Saved successfully.");
        setActiveModal(null);
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Request failed.";
        setError(
          msg.includes("fetch")
            ? "Upload failed. Use JPG/PNG/WebP/GIF under 5MB and restart the dev server if this persists."
            : msg,
        );
      }
    });
  }

  const linkDiscord = () => {
    // Navigate immediately — avoid clearAlerts() first (it collapses the error banner and shifts the page).
    window.location.assign("/api/profile/discord/connect");
  };

  const handleDisconnectDiscord = () => {
    if (
      !window.confirm(
        "Unlink Discord? This removes your verified connection and handle from your profile and the public roster.",
      )
    ) {
      return;
    }
    clearAlerts();
    startTransition(async () => {
      const result = await disconnectDiscord();
      if (!result.ok) {
        setError(result.error ?? "Could not unlink Discord.");
        return;
      }
      setDiscordLinked(false);
      setDiscordHandle(null);
      setMessage(result.message ?? "Discord unlinked.");
      router.refresh();
    });
  };

  const handleUpdateField = (fieldName: string, value: string) => {
    // Frontend validation for Display Name
    if (fieldName === "name") {
      if (!/^[a-zA-Z\s]+$/.test(value)) {
        setError("Display name can only contain letters and spaces.");
        return;
      }
    }

    let finalValue = value;
    if (fieldName === "linkedin") {
      const trimmed = value.trim();
      if (trimmed === "https://www.linkedin.com/in/" || !trimmed) {
        finalValue = "";
      } else {
        finalValue = trimmed;
      }
    }

    const fd = new FormData();
    fd.append("name", fieldName === "name" ? finalValue : (profile.name ?? ""));
    fd.append("phone", fieldName === "phone" ? finalValue : (profile.phone ?? ""));
    fd.append("discord", discordHandle ?? "");
    fd.append("instagram", fieldName === "instagram" ? finalValue : (profile.instagram ?? ""));
    fd.append("linkedin", fieldName === "linkedin" ? finalValue : (profile.linkedin ?? ""));
    fd.append("nickname", fieldName === "nickname" ? finalValue : (profile.nickname ?? ""));
    
    runAction(() => updatePersonalProfile(fd));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile image must be under 5MB.");
      e.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    const fd = new FormData();
    fd.append("profilePic", file);

    runAction(() => updateProfileAvatar(fd));
    e.target.value = "";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14 select-none">
      <header className="mb-10">
        <h1 className="font-tech text-3xl font-bold uppercase tracking-wider text-on-surface sm:text-4xl">
          Edit profile
        </h1>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
        {/* Sidebar Nav */}
        <aside className="lg:w-56 shrink-0">
          <nav className="flex flex-row gap-2 overflow-x-auto lg:flex-col lg:gap-1">
            <button
              type="button"
              onClick={() => {
                setSection("account");
                clearAlerts();
              }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider transition-colors whitespace-nowrap ${
                section === "account"
                  ? "bg-red-600/20 text-on-surface border border-red-500/30"
                  : "text-on-surface-variant hover:bg-white/5 border border-transparent"
              }`}
            >
              <User className="h-4 w-4 shrink-0" />
              My Account
            </button>
            <button
              type="button"
              onClick={() => {
                setSection("delete");
                clearAlerts();
              }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider transition-colors whitespace-nowrap ${
                section === "delete"
                  ? "bg-red-600/20 text-on-surface border border-red-500/30"
                  : "text-on-surface-variant hover:bg-white/5 border border-transparent"
              }`}
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              Delete Profile
            </button>
          </nav>
        </aside>

        {/* Content Panel */}
        <div className="min-w-0 flex-1">
          {statusBanner ? <div className="mb-6">{statusBanner}</div> : null}

          {section === "account" && (
            <div className="space-y-6">
              {/* Account Info Card (Discord Style) */}
              <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1118]/60 shadow-lg">
                {/* Banner */}
                <div className="h-24 w-full bg-gradient-to-r from-red-950 via-primary-dim to-red-950 opacity-90" />
                
                {/* Profile Header Block */}
                <div className="relative flex flex-col px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end -mt-12 sm:-mt-10">
                    {/* Avatar Group */}
                    <div className="group relative h-24 w-24 overflow-hidden rounded-full border-4 border-[#0d1118] bg-white/5 shadow-md">
                      <Image
                        src={avatarSrc}
                        alt="Profile Avatar"
                        fill
                        className="object-cover"
                        sizes="96px"
                        unoptimized={avatarSrc.startsWith("/uploads/") || avatarSrc.startsWith("blob:")}
                      />
                      <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white text-center px-1">
                          Change Avatar
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          disabled={pending}
                        />
                      </label>
                    </div>

                    <div className="text-center sm:text-left sm:pb-2">
                      <h2 className="font-tech text-2xl font-bold tracking-wide text-on-surface">
                        {profile.nickname || profile.name}
                      </h2>
                      <div className="mt-1.5 flex items-center justify-center sm:justify-start">
                        <div
                          className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.04] border border-white/10 px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase"
                          style={{ color: profile.roleColor ?? "#9a8a90" }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: profile.roleColor ?? "#9a8a90" }}
                          />
                          {profile.roleName ?? "Member"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details Table Rows */}
                <div className="border-t border-white/8 bg-[#0b0c10]/40 p-6 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    Account Info
                  </h3>

                  {/* Username Row */}
                  <div className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 p-3.5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                        Display Name
                      </p>
                      <p className="mt-1 text-sm font-medium text-on-surface">
                        {profile.name ?? "Not Set"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTempName(profile.name ?? "");
                        setActiveModal("name");
                      }}
                      className="rounded bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-white/10 hover:border-white/20 transition-all"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Nickname Row */}
                  <div className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 p-3.5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                        Nickname
                      </p>
                      <p className="mt-1 text-sm font-medium text-on-surface">
                        {profile.nickname ? profile.nickname : "Not Set"}
                      </p>
                    </div>
                    {profile.canEditNickname ? (
                      <button
                        type="button"
                        onClick={() => {
                          setTempNickname(profile.nickname ?? "");
                          setActiveModal("nickname");
                        }}
                        className="rounded bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-white/10 hover:border-white/20 transition-all"
                      >
                        Edit
                      </button>
                    ) : (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant/30 select-none px-2">
                        Locked (Staff Only)
                      </span>
                    )}
                  </div>

                  {/* Email Row */}
                  <div className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 p-3.5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                        Email
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-sm font-medium text-on-surface font-mono">
                          {revealEmail ? profile.email : maskEmail(profile.email)}
                        </p>
                        {profile.emailVerified ? (
                          <span className="rounded bg-green-500/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-green-400">
                            Verified
                          </span>
                        ) : (
                          <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-amber-400">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRevealEmail(!revealEmail)}
                        className="rounded px-2.5 py-1.5 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
                      >
                        {revealEmail ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setError("To change your registered email, contact Lodus Admin.");
                          setMessage("");
                        }}
                        className="rounded bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-white/10 hover:border-white/20 transition-all"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Phone Row */}
                  <div className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 p-3.5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                        Phone Number
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-sm font-medium text-on-surface font-mono">
                          {profile.phone
                            ? (revealPhone ? profile.phone : maskPhone(profile.phone))
                            : "No phone number on file"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {profile.phone && (
                        <button
                          type="button"
                          onClick={() => setRevealPhone(!revealPhone)}
                          className="rounded px-2.5 py-1.5 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
                        >
                          {revealPhone ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setTempPhone(profile.phone ?? "");
                          setActiveModal("phone");
                        }}
                        className="rounded bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-white/10 hover:border-white/20 transition-all"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Password & Security Card */}
              <div className="rounded-xl border border-white/10 bg-[#0d1118]/60 p-6 shadow-lg">
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">
                  Password & Security
                </h3>

                <div className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 p-3.5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Password
                    </p>
                    <p className="mt-1 text-sm font-medium text-on-surface font-mono tracking-widest">
                      ••••••••••••
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveModal("password")}
                    className="rounded bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
                  >
                    {profile.hasCustomPassword ? "Change Password" : "Set Password"}
                  </button>
                </div>
              </div>

              {/* Connections Card */}
              <div className="rounded-xl border border-white/10 bg-[#0d1118]/60 p-6 shadow-lg space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    Connected Accounts
                  </h3>
                  <p className="mt-1 text-[11px] text-on-surface-variant leading-relaxed">
                    Link your profiles to showcase your social handles on the roster directory.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {/* Discord Connection Card */}
                  <div className="relative flex flex-col justify-between rounded-lg border border-white/5 bg-[#5865F2]/8 p-4 hover:bg-[#5865F2]/12 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <DiscordIcon className="h-5 w-5 text-[#5865F2]" />
                        <div>
                          <p className="text-xs font-bold text-[#ece8ea] uppercase tracking-wide">
                            Discord
                          </p>
                          <p className="mt-0.5 text-xs text-on-surface-variant truncate max-w-[140px]">
                            {discordLinked && discordHandle
                              ? `@${discordHandle}`
                              : discordLinked
                                ? "Linked"
                                : "Not Connected"}
                          </p>
                        </div>
                      </div>
                      {discordLinked && (
                        <span className="rounded-full bg-green-500/20 p-0.5 text-green-400" title="Verified via Discord">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </div>
                    {discordLinked ? (
                      profile.hasCustomPassword ? (
                        <button
                          type="button"
                          onClick={handleDisconnectDiscord}
                          disabled={pending}
                          className="mt-4 w-full rounded bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-300 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Unlink
                        </button>
                      ) : (
                        <div className="mt-4 text-[10px] text-amber-400 font-semibold text-center leading-normal bg-amber-950/20 border border-amber-500/10 rounded p-2">
                          Set a password first to enable unlink
                        </div>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={linkDiscord}
                        disabled={pending}
                        className="mt-4 w-full rounded bg-[#5865F2] hover:bg-[#4752c4] py-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Connect with Discord
                      </button>
                    )}
                  </div>

                  {/* Instagram Connection Card */}
                  <div className="relative flex flex-col justify-between rounded-lg border border-white/5 bg-pink-500/5 p-4 hover:bg-pink-500/8 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <InstagramIcon className="h-5 w-5 text-pink-400" />
                        <div>
                          <p className="text-xs font-bold text-[#ece8ea] uppercase tracking-wide">
                            Instagram
                          </p>
                          <p className="mt-0.5 text-xs text-on-surface-variant truncate max-w-[140px]">
                            {profile.instagram ? `@${profile.instagram}` : "Not Added"}
                          </p>
                        </div>
                      </div>
                      {profile.instagram && (
                        <span className="rounded-full bg-green-500/20 p-0.5 text-green-400">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTempInstagram(profile.instagram ?? "");
                        setActiveModal("instagram");
                      }}
                      className="mt-4 w-full rounded bg-white/5 hover:bg-white/10 border border-white/10 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#ece8ea] transition-colors"
                    >
                      {profile.instagram ? "Edit" : "Add"}
                    </button>
                  </div>

                  {/* LinkedIn Connection Card */}
                  <div className="relative flex flex-col justify-between rounded-lg border border-white/5 bg-[#0077b5]/5 p-4 hover:bg-[#0077b5]/8 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <LinkedinIcon className="h-5 w-5 text-[#0077b5]" />
                        <div>
                          <p className="text-xs font-bold text-[#ece8ea] uppercase tracking-wide">
                            LinkedIn
                          </p>
                          <p className="mt-0.5 text-xs text-on-surface-variant truncate max-w-[140px]">
                            {profile.linkedin ? profile.linkedin : "Not Added"}
                          </p>
                        </div>
                      </div>
                      {profile.linkedin && (
                        <span className="rounded-full bg-green-500/20 p-0.5 text-green-400">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTempLinkedin(profile.linkedin ? profile.linkedin : "https://www.linkedin.com/in/");
                        setActiveModal("linkedin");
                      }}
                      className="mt-4 w-full rounded bg-white/5 hover:bg-white/10 border border-white/10 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#ece8ea] transition-colors"
                    >
                      {profile.linkedin ? "Edit" : "Add"}
                    </button>
                  </div>
                </div>
              </div>

              <ProfileSkillsSection initialSkills={profile.skills} />

              {/* Account Standing Card (Discord Style) */}
              <div className="flex items-start gap-4 rounded-xl border border-green-500/20 bg-green-500/5 p-5 shadow-lg">
                <div className="rounded-full bg-green-500/15 p-2 text-green-400">
                  <span className="text-lg font-bold">✓</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Your account is all good</h3>
                  <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">
                    Thanks for upholding Lodus community terms and guild rules. If you break rules or receive warnings, they will show up here.
                  </p>
                </div>
              </div>
            </div>
          )}

          {section === "delete" && (
            <div className="rounded-xl border border-white/10 bg-[#0d1118]/60 p-6 sm:p-8 lg:p-10 shadow-lg space-y-6">
              <div>
                <h2 className="font-tech text-2xl font-bold uppercase tracking-wide text-on-surface">
                  Delete Profile
                </h2>
                <p className="mt-1.5 text-sm text-on-surface-variant leading-relaxed">
                  Permanently remove your Lodus account and roster entry. This cannot be undone.
                </p>
              </div>

              <div className="max-w-xl space-y-5">
                <p className="text-xs text-red-400 font-medium leading-relaxed bg-red-950/20 border border-red-500/10 rounded-lg p-3">
                  You will lose access immediately. Applications and membership data tied to{" "}
                  <strong className="text-red-300 font-mono">{profile.email}</strong> will be
                  permanently removed.
                </p>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Type your email to verify deletion
                  </label>
                  <input
                    type="email"
                    name="confirmEmail"
                    value={deleteConfirmEmail}
                    onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                    placeholder={profile.email}
                    required
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    className="w-full rounded-lg px-3 py-2.5 text-sm bg-black/20 border border-white/10 text-white font-mono placeholder:text-on-surface-variant/40"
                  />
                  <p className="text-[10px] text-on-surface-variant/60 font-mono">
                    Enter exactly: {profile.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const typed = deleteConfirmEmail.trim().toLowerCase();
                    if (!typed) {
                      setError("Type your email address to continue.");
                      return;
                    }
                    if (typed !== profile.email.toLowerCase()) {
                      setError("Email does not match your account.");
                      return;
                    }
                    clearAlerts();
                    setShowDeleteConfirm(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-950/50 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-red-300 hover:bg-red-900/50 transition-colors cursor-pointer"
                >
                  Delete my profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* OVERLAY MODALS FOR EDITING FIELDS (Discord Style) */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <button
            type="button"
            onClick={() => setActiveModal(null)}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm focus:outline-none"
            aria-label="Close modal"
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-[#0d1118] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <h4 className="font-tech text-xl font-bold tracking-wide text-on-surface uppercase">
                {activeModal === "name" && "Edit Display Name"}
                {activeModal === "nickname" && "Edit Nickname"}
                {activeModal === "phone" && "Edit Phone Number"}
                {activeModal === "password" && "Change Password"}
                {activeModal === "instagram" && "Instagram Handle"}
                {activeModal === "linkedin" && "LinkedIn URL"}
              </h4>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-on-surface-variant hover:text-on-surface transition-colors p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form Content */}
            <div className="p-5">
              {/* Edit Name Form */}
              {activeModal === "name" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateField("name", tempName);
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      placeholder="Letters and spaces only"
                      required
                      pattern="^[a-zA-Z\s]+$"
                      title="Letters and spaces only, no special characters or numbers"
                      className="w-full rounded-lg px-3 py-2 text-sm"
                    />
                    <p className="text-[10px] text-on-surface-variant/60 leading-normal">
                      Display names must contain only letters and spaces, be unique, and can only be changed once every 7 days.
                    </p>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={pending}
                      className="rounded-lg bg-red-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}

              {/* Edit Nickname Form */}
              {activeModal === "nickname" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateField("nickname", tempNickname);
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Nickname (Staff Only)
                    </label>
                    <input
                      type="text"
                      value={tempNickname}
                      onChange={(e) => setTempNickname(e.target.value)}
                      placeholder="Optional server nickname"
                      className="w-full rounded-lg px-3 py-2 text-sm"
                    />
                    <p className="text-[10px] text-on-surface-variant/60 leading-normal">
                      Leaves empty to default back to the display name. Nicknames can only be updated by admins and owners.
                    </p>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={pending}
                      className="rounded-lg bg-red-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}

              {/* Edit Phone Form */}
              {activeModal === "phone" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateField("phone", tempPhone);
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={tempPhone}
                      onChange={(e) => setTempPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      required
                      className="w-full rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={pending}
                      className="rounded-lg bg-red-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}

              {activeModal === "password" && (
                <PasswordResetForm
                  userId={profile.userId}
                  submitLabel={profile.hasCustomPassword ? "Update Password" : "Set Password"}
                  onCancel={() => setActiveModal(null)}
                  onSuccess={() => {
                    setActiveModal(null);
                    setMessage("Password updated successfully.");
                    setError("");
                    router.refresh();
                  }}
                />
              )}

              {/* Edit Instagram Form */}
              {activeModal === "instagram" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateField("instagram", tempInstagram);
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Instagram Username
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant font-medium">@</span>
                      <input
                        type="text"
                        value={tempInstagram}
                        onChange={(e) => setTempInstagram(e.target.value.replace(/^@/, ""))}
                        placeholder="your.handle"
                        className="w-full rounded-lg pl-7 pr-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={pending}
                      className="rounded-lg bg-red-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}

              {/* Edit LinkedIn Form */}
              {activeModal === "linkedin" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateField("linkedin", tempLinkedin);
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      LinkedIn Profile URL
                    </label>
                    <input
                      type="text"
                      value={tempLinkedin}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.startsWith("https://www.linkedin.com/in/")) {
                          setTempLinkedin(val);
                        } else if ("https://www.linkedin.com/in/".startsWith(val)) {
                          setTempLinkedin("https://www.linkedin.com/in/");
                        } else {
                          setTempLinkedin(val);
                        }
                      }}
                      placeholder="https://www.linkedin.com/in/username"
                      className="w-full rounded-lg px-3 py-2 text-sm bg-black/20 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-red-500/50"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={pending}
                      className="rounded-lg bg-red-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CENTERED DELETION CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(false)}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm focus:outline-none"
            aria-label="Cancel deletion"
          />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-red-500/20 bg-[#160c0e] shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400 mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="font-tech text-lg font-bold uppercase tracking-wider text-[#ff4655]">
              Confirm Account Deletion
            </h3>
            <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">
              Are you absolutely sure you want to permanently delete your Lodus account? This action cannot be undone, and all your profile information and links will be destroyed.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-on-surface hover:bg-white/10 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  startTransition(async () => {
                    clearAlerts();
                    const fd = new FormData();
                    fd.append("confirmEmail", deleteConfirmEmail.trim());
                    const res = await deleteAccount(fd);
                    if (res && !res.ok) {
                      setError(res.error || "Failed to delete account.");
                    }
                  });
                }}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-500 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
