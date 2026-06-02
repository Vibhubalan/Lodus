"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Plus, UserPlus } from "lucide-react";
import { adminCreateRosterMember } from "@/app/admin/roster/actions";
import { useRouter } from "next/navigation";

export function AddRosterMemberForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const form = e.currentTarget;
    const fd = new FormData(form);

    startTransition(async () => {
      const res = await adminCreateRosterMember(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess(res.message);
      form.reset();
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
      setTimeout(() => setOpen(false), 1200);
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setError("");
          setSuccess("");
        }}
        className="mb-6 inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-primary transition-colors hover:bg-primary/20"
      >
        <UserPlus className="h-4 w-4" />
        Add member to homepage
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 space-y-4 rounded-xl border border-white/10 bg-[#0d1118]/80 p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-tech text-lg font-bold uppercase tracking-wider text-on-surface">
          Add roster member
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-on-surface-variant hover:text-on-surface"
        >
          Cancel
        </button>
      </div>
      <p className="text-xs text-on-surface-variant">
        Creates a placeholder profile for the public homepage. They cannot log in until membership
        opens.
      </p>

      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-400">
          {success}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            Email *
          </label>
          <input
            name="email"
            type="email"
            required
            placeholder="member@gmail.com"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            Display name *
          </label>
          <input
            name="name"
            type="text"
            required
            placeholder="Name on homepage"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
          Designation / title
        </label>
        <input
          name="designation"
          type="text"
          placeholder="e.g. Software Engineer"
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
          Profile photo
        </label>
        <input
          ref={fileRef}
          name="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="block w-full text-xs text-on-surface-variant file:mr-3 file:rounded file:border-0 file:bg-primary/20 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary"
        />
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-on-surface-variant">
        <label className="flex items-center gap-2">
          <input name="showInTeam" type="checkbox" value="true" defaultChecked className="rounded" />
          Show in team deck (Lower Lodus)
        </label>
        <label className="flex items-center gap-2">
          <input name="showInLeadership" type="checkbox" value="true" className="rounded" />
          Show in leadership deck (Upper Lodus)
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-500 disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {pending ? "Adding…" : "Add member"}
      </button>
    </form>
  );
}
