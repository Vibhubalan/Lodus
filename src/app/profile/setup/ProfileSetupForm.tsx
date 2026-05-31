"use client";

import { useActionState, useState } from "react";
import { completeProfileSetup } from "./actions";
import {
  User,
  Mail,
  Calendar,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { PasswordField } from "@/components/auth/PasswordField";
import { PhoneCountryInput } from "@/components/forms/PhoneCountryInput";
import { GameLogoPicker } from "@/components/members/GameLogoTiles";
import { signOut } from "next-auth/react";
import {
  MAX_SKILLS_PER_CATEGORY,
  SKILL_CATALOG,
  SKILL_CATEGORIES,
  type MemberSkills,
  type SkillCategory,
} from "@/lib/members/skill-catalog";

export function ProfileSetupForm({
  token,
  email,
  gameNames,
}: {
  token: string;
  email: string;
  gameNames: string[];
}) {
  const [state, formAction, isPending] = useActionState(completeProfileSetup, null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [dialCode, setDialCode] = useState("91");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [skills, setSkills] = useState<MemberSkills>({
    gaming: [],
    tech: [],
    social: [],
  });
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setImageError("Image must be under 5MB.");
        e.target.value = "";
        setImagePreview(null);
        return;
      }
      setImageError("");
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
      setImageError("");
    }
  };

  function toggleSkill(category: SkillCategory, skill: string) {
    setSkills((prev) => {
      const list = prev[category];
      if (list.includes(skill)) {
        return { ...prev, [category]: list.filter((s) => s !== skill) };
      }
      if (list.length >= MAX_SKILLS_PER_CATEGORY) return prev;
      return { ...prev, [category]: [...list, skill] };
    });
  }

  function toggleGame(name: string) {
    setSelectedGames((prev) =>
      prev.includes(name) ? prev.filter((g) => g !== name) : [...prev, name],
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d1118]/70 p-8 shadow-2xl backdrop-blur-xl">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

      <h2 className="font-tech text-3xl font-bold tracking-widest text-[#ece8ea] text-center uppercase mb-1">
        Setup Member Profile
      </h2>
      <p className="font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-widest text-center mb-8">
        Tell the community who you are
      </p>

      {state?.error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-xs text-red-400 font-mono">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {state?.success ? (
        <div className="space-y-6 text-center py-6 animate-in fade-in duration-300">
          <div className="mx-auto rounded-full bg-green-500/15 text-green-500 border border-green-500/20 p-4 w-16 h-16 flex items-center justify-center shadow-[0_0_24px_rgba(34,197,94,0.15)]">
            <CheckCircle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-tech text-xl font-bold uppercase tracking-wider text-[#ece8ea]">
              Profile Complete
            </h3>
            <p className="font-mono text-[10px] text-on-surface-variant/80 leading-relaxed max-w-xs mx-auto">
              You can sign in with your email and the password you just set.
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login?setup=success" })}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] hover:bg-red-500 transition-all duration-200"
          >
            Go to Login
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <form
          action={formAction}
          className="space-y-5"
          autoComplete="off"
          onSubmit={(e) => {
            if (password !== confirmPassword) {
              e.preventDefault();
              setPasswordMismatch(true);
              return;
            }
            setPasswordMismatch(false);
          }}
        >
          <input type="hidden" name="token" value={token} />
          {SKILL_CATEGORIES.map((category) =>
            skills[category].map((skill) => (
              <input key={`${category}-${skill}`} type="hidden" name={`skills_${category}`} value={skill} />
            )),
          )}
          {selectedGames.map((game) => (
            <input key={game} type="hidden" name="games" value={game} />
          ))}

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/30" />
              <input
                type="email"
                value={email}
                readOnly
                className="w-full rounded-lg py-2.5 pl-10 pr-4 text-sm text-white/50 bg-[#07090d]/60 border border-white/5 cursor-not-allowed focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Display Name *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/40" />
              <input
                type="text"
                name="name"
                required
                autoComplete="off"
                data-lpignore="true"
                placeholder="Your name"
                className="w-full rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-red-500/50 auth-input-override"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
              Profile Picture *
            </label>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-[#07090d]/60 border border-white/5">
              <div className="relative h-16 w-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-on-surface-variant/35" />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <input
                  type="file"
                  name="profilePic"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  required
                  onChange={handleImageChange}
                  className="hidden"
                  id="profile-pic-file"
                />
                <label
                  htmlFor="profile-pic-file"
                  className="inline-block rounded border border-white/10 hover:border-red-500/50 bg-[#121620]/60 hover:bg-[#121620]/90 px-3 py-1.5 text-xs font-semibold text-[#ece8ea] cursor-pointer transition-colors"
                >
                  Choose Image
                </label>
                <p className="text-[9px] text-on-surface-variant/60 font-mono">
                  JPG, PNG, WebP, or GIF (max 5MB)
                </p>
                {imageError ? (
                  <p className="text-[9px] text-red-400 font-mono">{imageError}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <PasswordField
              id="setup-password"
              label="Set Password *"
              value={password}
              onChange={setPassword}
              minLength={8}
              name="password"
              autoComplete="new-password"
            />
            <PasswordField
              id="setup-confirm-password"
              label="Confirm Password *"
              value={confirmPassword}
              onChange={setConfirmPassword}
              minLength={8}
              name="confirmPassword"
              autoComplete="new-password"
            />
            {passwordMismatch || (password && confirmPassword && password !== confirmPassword) ? (
              <p className="text-xs text-red-400 font-mono">Passwords do not match.</p>
            ) : null}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Phone Number *
            </label>
            <PhoneCountryInput
              dialCode={dialCode}
              localNumber={phoneLocal}
              onDialCodeChange={setDialCode}
              onLocalNumberChange={setPhoneLocal}
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Birthdate *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none" />
              <input
                type="date"
                name="birthdate"
                required
                max={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/50 auth-input-override [color-scheme:dark]"
              />
            </div>
            <p className="text-[9px] text-on-surface-variant/50 font-mono">
              Your age is shown on member cards from this date.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              About Me *
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 h-4 w-4 text-on-surface-variant/40" />
              <textarea
                name="bio"
                required
                rows={4}
                maxLength={2000}
                placeholder="A short intro for your profile and member card…"
                className="w-full resize-none rounded-lg border border-white/10 bg-black/30 py-2.5 pl-10 pr-4 text-sm text-white placeholder-on-surface-variant/40 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/50"
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-white/5 bg-[#07090d]/40 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Skills (optional)
            </p>
            {SKILL_CATEGORIES.map((category) => (
              <div key={category}>
                <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-primary/80">
                  {category}
                </p>
                <div className="flex flex-wrap gap-2">
                  {SKILL_CATALOG[category].map((skill) => {
                    const active = skills[category].includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(category, skill)}
                        disabled={isPending}
                        className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                          active
                            ? "border-red-500/50 bg-red-500/15 text-white"
                            : "border-white/10 bg-white/5 text-on-surface-variant hover:border-white/20"
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

          <div className="space-y-2 rounded-lg border border-white/5 bg-[#07090d]/40 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Games Played (optional)
            </p>
            <GameLogoPicker
              availableNames={gameNames}
              selected={selectedGames}
              onToggle={toggleGame}
              disabled={isPending}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending || (password !== confirmPassword && !!confirmPassword)}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] hover:bg-red-500 disabled:opacity-50 transition-all duration-200"
            >
              {isPending ? "Saving Profile…" : "Complete Setup"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
