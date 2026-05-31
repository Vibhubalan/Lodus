"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { updateMemberSkillsFromForm } from "@/app/profile/actions";
import {
  MAX_SKILLS_PER_CATEGORY,
  SKILL_CATALOG,
  SKILL_CATEGORIES,
  type MemberSkills,
  type SkillCategory,
} from "@/lib/members/skill-catalog";

export function ProfileSkillsSection({ initialSkills }: { initialSkills: MemberSkills }) {
  const router = useRouter();
  const [prevInitialSkills, setPrevInitialSkills] = useState(initialSkills);
  const [skills, setSkills] = useState<MemberSkills>(initialSkills);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (initialSkills !== prevInitialSkills) {
    setPrevInitialSkills(initialSkills);
    setSkills(initialSkills);
  }

  const isDirty = JSON.stringify(skills) !== JSON.stringify(initialSkills);

  function reset() {
    setSkills(initialSkills);
    setMessage("");
    setError("");
  }

  function toggle(category: SkillCategory, skill: string) {
    setSkills((prev) => {
      const list = prev[category];
      const has = list.includes(skill);
      if (has) {
        return { ...prev, [category]: list.filter((s) => s !== skill) };
      }
      if (list.length >= MAX_SKILLS_PER_CATEGORY) return prev;
      return { ...prev, [category]: [...list, skill] };
    });
  }

  function save() {
    setMessage("");
    setError("");
    const fd = new FormData();
    for (const category of SKILL_CATEGORIES) {
      for (const skill of skills[category]) {
        fd.append(`skills_${category}`, skill);
      }
    }
    startTransition(async () => {
      const result = await updateMemberSkillsFromForm(fd);
      if (!result.ok) {
        setError(result.error ?? "Could not save skills.");
        return;
      }
      setMessage(result.message ?? "Skills saved.");
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1118]/60 p-6 shadow-lg">
      <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
        Skills
      </h3>
      <p className="mb-6 text-sm text-on-surface-variant">
        Pick up to {MAX_SKILLS_PER_CATEGORY} skills per category for your directory profile.
      </p>

      <div className="space-y-6">
        {SKILL_CATEGORIES.map((category) => (
          <div key={category}>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-primary">
              {category}
            </p>
            <div className="flex flex-wrap gap-2">
              {SKILL_CATALOG[category].map((skill) => {
                const active = skills[category].includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggle(category, skill)}
                    className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                      active
                        ? "border-primary/50 bg-primary/15 text-on-surface"
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

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-green-300">{message}</p> : null}

      {/* Discord-style unsaved changes floating warning bar */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex w-[calc(100%-2rem)] max-w-2xl justify-between items-center rounded-xl bg-[#111214] border border-white/5 p-4 shadow-2xl animate-in slide-in-from-bottom-6 duration-300">
          <span className="text-xs font-semibold text-white">
            Careful — you have unsaved changes!
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={reset}
              disabled={pending}
              className="text-xs font-semibold text-white hover:underline hover:text-white/80 transition-all cursor-pointer"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="flex items-center gap-1.5 rounded bg-[#248046] hover:bg-[#1a6535] px-4 py-2 text-xs font-semibold text-white shadow-lg transition-all cursor-pointer"
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
