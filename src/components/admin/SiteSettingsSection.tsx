"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  Settings,
  Image as ImageIcon,
  Loader2,
  Calendar,
  Sparkles,
  Zap,
  Clock,
  Swords,
  Gamepad2,
  Users,
  Compass,
  Trophy,
  History,
  Info,
  Flame,
  Shield,
  Star,
} from "lucide-react";
import { updateSiteContent, uploadSiteAboutImage } from "@/app/admin/actions";
import { HomepageDeckEditor } from "@/components/admin/HomepageDeckEditor";
import { useRouter } from "next/navigation";
import {
  DEFAULT_HOMEPAGE_CONFIG,
  parseHomepageConfig,
  serializeHomepageConfig,
  type HomepageConfig,
  type HomepageMemberOverride,
} from "@/lib/site/homepage-config";
import type { RosterMember } from "@/lib/members/roster-types";
import Image from "next/image";

const HIGHLIGHT_ICONS_LIST = [
  "calendar",
  "sparkles",
  "zap",
  "clock",
  "swords",
  "gamepad",
  "users",
  "compass",
  "trophy",
  "history",
  "info",
  "flame",
  "shield",
  "star",
];

const SITE_SETTINGS_FORM_ID = "site-settings-form";

const HIGHLIGHT_ICON_COMPONENTS: Record<string, React.ComponentType<any>> = {
  calendar: Calendar,
  sparkles: Sparkles,
  zap: Zap,
  clock: Clock,
  swords: Swords,
  gamepad: Gamepad2,
  users: Users,
  compass: Compass,
  trophy: Trophy,
  history: History,
  info: Info,
  flame: Flame,
  shield: Shield,
  star: Star,
};

type SiteContent = {
  id: number;
  tagline: string;
  aboutTitle: string;
  aboutImageUrl: string;
  aboutMarkdown: string;
  storyMarkdown: string | null;
  foundedLabel: string;
  foundedHistory: string;
  pinnedNote: string | null;
  highlightsJson: string;
  homepageJson: string;
};

export function SiteSettingsSection({
  site,
  roster,
}: {
  site: SiteContent | null;
  roster: RosterMember[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const defaultSite: SiteContent = {
    id: 0,
    tagline: "Our group. Our games. Our space.",
    aboutTitle: "About Lodus",
    aboutImageUrl: "/images/about/lodus-photo.png",
    aboutMarkdown: "We are just a bunch of absolute uncs sitting here looking completely jobless...",
    storyMarkdown: null,
    foundedLabel: "March 2024",
    foundedHistory: "Founded as a community of gamers.",
    pinnedNote: null,
    highlightsJson: "[]",
    homepageJson: "{}",
  };

  const currentSite = site || defaultSite;
  const initialHomepage = parseHomepageConfig(currentSite.homepageJson);

  // Form states
  const [tagline, setTagline] = useState(currentSite.tagline);
  const [aboutTitle, setAboutTitle] = useState(currentSite.aboutTitle);
  const [aboutImageUrl, setAboutImageUrl] = useState(currentSite.aboutImageUrl);
  const [aboutMarkdown, setAboutMarkdown] = useState(currentSite.aboutMarkdown);
  const [storyMarkdown, setStoryMarkdown] = useState(currentSite.storyMarkdown || "");
  const [foundedLabel, setFoundedLabel] = useState(currentSite.foundedLabel);
  const [foundedHistory, setFoundedHistory] = useState(currentSite.foundedHistory);
  const [pinnedNote, setPinnedNote] = useState(currentSite.pinnedNote || "");

  // Highlights state (parsed from JSON, array of 3 items)
  const initialHighlights = (() => {
    try {
      const parsed = JSON.parse(currentSite.highlightsJson);
      if (Array.isArray(parsed) && parsed.length === 3) {
        return parsed;
      }
    } catch (e) {}
    return [
      { icon: "calendar", label: "Daily Gandmastis" },
      { icon: "flame", label: "UNC - Energy" },
      { icon: "history", label: "Since 2021" },
    ];
  })();

  const [highlights, setHighlights] = useState(initialHighlights);
  const [homepage, setHomepage] = useState<HomepageConfig>(initialHomepage);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadingAboutImage, setUploadingAboutImage] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const handleAboutImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingAboutImage(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.set("aboutImage", file);

    try {
      const res = await uploadSiteAboutImage(formData);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setAboutImageUrl(res.url);
      setSuccess("About photo uploaded. Save other changes or refresh the homepage to confirm.");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      setUploadingAboutImage(false);
    }
  };

  const handleHighlightChange = (index: number, key: "icon" | "label", value: string) => {
    setHighlights((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  const homepageDirty =
    serializeHomepageConfig(homepage) !== serializeHomepageConfig(initialHomepage);

  const isDirty =
    tagline !== currentSite.tagline ||
    aboutTitle !== currentSite.aboutTitle ||
    aboutImageUrl !== currentSite.aboutImageUrl ||
    aboutMarkdown !== currentSite.aboutMarkdown ||
    storyMarkdown !== (currentSite.storyMarkdown || "") ||
    foundedLabel !== currentSite.foundedLabel ||
    foundedHistory !== currentSite.foundedHistory ||
    pinnedNote !== (currentSite.pinnedNote || "") ||
    JSON.stringify(highlights) !== JSON.stringify(initialHighlights) ||
    homepageDirty;

  const patchHomepage = <K extends keyof HomepageConfig>(
    section: K,
    patch: Partial<HomepageConfig[K]>,
  ) => {
    setHomepage((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...patch },
    }));
  };

  const handleOverrideChange = (
    memberId: string,
    patch: Partial<HomepageMemberOverride>,
  ) => {
    setHomepage((prev) => {
      const next = { ...prev.overrides[memberId], ...patch };
      const cleaned: HomepageMemberOverride = {};
      if (next.displayName?.trim()) cleaned.displayName = next.displayName.trim();
      if (next.tagline?.trim()) cleaned.tagline = next.tagline.trim();
      const overrides = { ...prev.overrides };
      if (Object.keys(cleaned).length === 0) {
        delete overrides[memberId];
      } else {
        overrides[memberId] = cleaned;
      }
      return { ...prev, overrides };
    });
  };

  const handleReset = () => {
    setTagline(currentSite.tagline);
    setAboutTitle(currentSite.aboutTitle);
    setAboutImageUrl(currentSite.aboutImageUrl);
    setAboutMarkdown(currentSite.aboutMarkdown);
    setStoryMarkdown(currentSite.storyMarkdown || "");
    setFoundedLabel(currentSite.foundedLabel);
    setFoundedHistory(currentSite.foundedHistory);
    setPinnedNote(currentSite.pinnedNote || "");
    setHighlights(initialHighlights);
    setHomepage(initialHomepage);
    setError("");
    setSuccess("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!tagline.trim() || !aboutTitle.trim() || !aboutMarkdown.trim() || !aboutImageUrl.trim()) {
      setError("Please fill in all required fields and upload an About photo.");
      return;
    }

    const formData = new FormData();
    formData.set("tagline", tagline);
    formData.set("aboutTitle", aboutTitle);
    formData.set("aboutImageUrl", aboutImageUrl);
    formData.set("aboutMarkdown", aboutMarkdown);
    formData.set("storyMarkdown", storyMarkdown);
    formData.set("foundedLabel", foundedLabel);
    formData.set("foundedHistory", foundedHistory);
    formData.set("pinnedNote", pinnedNote);
    formData.set("highlightsJson", JSON.stringify(highlights));
    formData.set("homepageJson", serializeHomepageConfig(homepage));

    startTransition(async () => {
      try {
        await updateSiteContent(formData);
        setSuccess("Site content updated successfully!");
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Failed to update site settings.");
      }
    });
  };

  return (
    <div className="w-full">
      <header className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <Settings className="h-7 w-7 text-primary" />
          <h1 className="font-tech text-3xl font-bold tracking-wider text-on-surface uppercase sm:text-4xl">
            Site Settings
          </h1>
        </div>
        <p className="max-w-xl text-sm text-on-surface-variant">
          Admin-only controls for the full homepage: hero, about, decks, header brand, footer, and per-card
          copy. Deck toggles save immediately; everything else uses Save Changes.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 font-mono">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400 font-mono">
          {success}
        </div>
      )}

      <form
        id={SITE_SETTINGS_FORM_ID}
        onSubmit={handleSubmit}
        className="space-y-6 pb-28"
      >
        {/* Landing Page Tagline Card */}
        <div className="glass-card rounded-xl border border-white/5 bg-[#0d1118]/80 p-6 shadow-xl space-y-4">
          <h3 className="font-tech text-lg font-bold uppercase tracking-wider text-white">Hero Tagline</h3>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Tagline (Hero text shown on landing page)
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
              placeholder="Our group. Our games. Our space."
            />
          </div>
        </div>

        {/* About Us Card */}
        <div className="glass-card rounded-xl border border-white/5 bg-[#0d1118]/80 p-6 shadow-xl space-y-4">
          <h3 className="font-tech text-lg font-bold uppercase tracking-wider text-white">About Us Section</h3>
          <div className="space-y-4">
            <div className="space-y-1.5 max-w-md">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                About Title
              </label>
              <input
                type="text"
                value={aboutTitle}
                onChange={(e) => setAboutTitle(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                placeholder="About Lodus"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                About Photo (admin upload only)
              </label>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/40 sm:w-28">
                  {aboutImageUrl ? (
                    <Image
                      src={aboutImageUrl}
                      alt="About preview"
                      fill
                      className="object-cover object-center"
                      sizes="112px"
                      unoptimized={aboutImageUrl.startsWith("http")}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-on-surface-variant/40">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary transition-colors hover:bg-primary/20">
                    {uploadingAboutImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImageIcon className="h-4 w-4" />
                    )}
                    {uploadingAboutImage ? "Uploading…" : "Upload new photo"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      disabled={uploadingAboutImage || pending}
                      onChange={handleAboutImageUpload}
                    />
                  </label>
                  <p className="text-[10px] leading-relaxed text-on-surface-variant/70">
                    JPG, PNG, WebP, or GIF · max 5MB. Saved to the site — not editable by public viewers.
                  </p>
                  <p className="truncate font-mono text-[10px] text-on-surface-variant/50" title={aboutImageUrl}>
                    {aboutImageUrl || "No image yet"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              About Description / Copy (Supports newlines to separate paragraphs)
            </label>
            <textarea
              value={aboutMarkdown}
              onChange={(e) => setAboutMarkdown(e.target.value)}
              required
              rows={5}
              className="w-full rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-white focus:border-red-500 focus:outline-none resize-y"
              placeholder="We are a community of gamers..."
            />
          </div>
        </div>

        {/* Highlights Section */}
        <div className="glass-card rounded-xl border border-white/5 bg-[#0d1118]/80 p-6 shadow-xl space-y-4">
          <h3 className="font-tech text-lg font-bold uppercase tracking-wider text-white">Highlights Grid (Exactly 3 cards)</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {highlights.map((hl, idx) => {
              const SelectedIcon = HIGHLIGHT_ICON_COMPONENTS[hl.icon] || Info;
              return (
                <div key={idx} className="rounded-lg border border-white/10 bg-black/25 p-4 space-y-3 relative">
                  <div className="absolute right-3 top-3 flex items-center justify-center rounded bg-primary/10 border border-primary/20 p-1 text-primary">
                    <SelectedIcon className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Highlight {idx + 1}</h4>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Icon Component
                    </label>
                    <select
                      value={hl.icon}
                      onChange={(e) => handleHighlightChange(idx, "icon", e.target.value)}
                      className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white focus:border-red-500 focus:outline-none"
                    >
                      {HIGHLIGHT_ICONS_LIST.map((ic) => (
                        <option key={ic} value={ic} className="bg-[#0b0e14]">
                          {ic}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Label Text
                    </label>
                    <input
                      type="text"
                      value={hl.label}
                      onChange={(e) => handleHighlightChange(idx, "label", e.target.value)}
                      required
                      className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white focus:border-red-500 focus:outline-none"
                      placeholder="e.g. Daily Activity"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Header / Nav */}
        <div className="glass-card rounded-xl border border-white/5 bg-[#0d1118]/80 p-6 shadow-xl space-y-4">
          <h3 className="font-tech text-lg font-bold uppercase tracking-wider text-white">Header</h3>
          <div className="space-y-1.5 max-w-md">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Brand name (top-left logo)
            </label>
            <input
              type="text"
              value={homepage.nav.brandName}
              onChange={(e) => patchHomepage("nav", { brandName: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
              placeholder={DEFAULT_HOMEPAGE_CONFIG.nav.brandName}
            />
          </div>
        </div>

        {/* Leadership section */}
        <div className="glass-card rounded-xl border border-white/5 bg-[#0d1118]/80 p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-tech text-lg font-bold uppercase tracking-wider text-white">
              Leadership Section
            </h3>
            <label className="flex items-center gap-2 text-xs text-on-surface-variant">
              <input
                type="checkbox"
                checked={homepage.leadership.hidden}
                onChange={(e) => patchHomepage("leadership", { hidden: e.target.checked })}
                className="rounded border-white/20"
              />
              Hide section
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Section title
              </label>
              <input
                type="text"
                value={homepage.leadership.title}
                onChange={(e) => patchHomepage("leadership", { title: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Subtitle
              </label>
              <input
                type="text"
                value={homepage.leadership.subtitle}
                onChange={(e) => patchHomepage("leadership", { subtitle: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                View all overlay title
              </label>
              <input
                type="text"
                value={homepage.leadership.overlayTitle}
                onChange={(e) => patchHomepage("leadership", { overlayTitle: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Team section */}
        <div className="glass-card rounded-xl border border-white/5 bg-[#0d1118]/80 p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-tech text-lg font-bold uppercase tracking-wider text-white">Team Section</h3>
            <label className="flex items-center gap-2 text-xs text-on-surface-variant">
              <input
                type="checkbox"
                checked={homepage.team.hidden}
                onChange={(e) => patchHomepage("team", { hidden: e.target.checked })}
                className="rounded border-white/20"
              />
              Hide section
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Section title
              </label>
              <input
                type="text"
                value={homepage.team.title}
                onChange={(e) => patchHomepage("team", { title: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Subtitle (use {"{{count}}"} for member count)
              </label>
              <input
                type="text"
                value={homepage.team.subtitle}
                onChange={(e) => patchHomepage("team", { subtitle: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                View all overlay title
              </label>
              <input
                type="text"
                value={homepage.team.overlayTitle}
                onChange={(e) => patchHomepage("team", { overlayTitle: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Homepage deck cards */}
        <div className="glass-card rounded-xl border border-white/5 bg-[#0d1118]/80 p-6 shadow-xl space-y-4">
          <h3 className="font-tech text-lg font-bold uppercase tracking-wider text-white">
            Homepage Deck Cards
          </h3>
          <HomepageDeckEditor
            roster={roster}
            overrides={homepage.overrides}
            onOverrideChange={handleOverrideChange}
          />
        </div>

        {/* Discord section */}
        <div className="glass-card rounded-xl border border-white/5 bg-[#0d1118]/80 p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-tech text-lg font-bold uppercase tracking-wider text-white">
              Discord / Community Block
            </h3>
            <label className="flex items-center gap-2 text-xs text-on-surface-variant">
              <input
                type="checkbox"
                checked={homepage.discord.hidden}
                onChange={(e) => patchHomepage("discord", { hidden: e.target.checked })}
                className="rounded border-white/20"
              />
              Hide section
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Title
              </label>
              <input
                type="text"
                value={homepage.discord.title}
                onChange={(e) => patchHomepage("discord", { title: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Subtitle
              </label>
              <input
                type="text"
                value={homepage.discord.subtitle}
                onChange={(e) => patchHomepage("discord", { subtitle: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="glass-card rounded-xl border border-white/5 bg-[#0d1118]/80 p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-tech text-lg font-bold uppercase tracking-wider text-white">Footer</h3>
            <label className="flex items-center gap-2 text-xs text-on-surface-variant">
              <input
                type="checkbox"
                checked={homepage.footer.hidden}
                onChange={(e) => patchHomepage("footer", { hidden: e.target.checked })}
                className="rounded border-white/20"
              />
              Hide footer
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Brand name
              </label>
              <input
                type="text"
                value={homepage.footer.brandName}
                onChange={(e) => patchHomepage("footer", { brandName: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Copyright line ({"{{year}}"} supported)
              </label>
              <input
                type="text"
                value={homepage.footer.copyrightText}
                onChange={(e) => patchHomepage("footer", { copyrightText: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Discord link label
              </label>
              <input
                type="text"
                value={homepage.footer.discordLabel}
                onChange={(e) => patchHomepage("footer", { discordLabel: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Email label (leave blank to show admin email)
              </label>
              <input
                type="text"
                value={homepage.footer.emailLabel}
                onChange={(e) => patchHomepage("footer", { emailLabel: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                placeholder="Contact"
              />
            </div>
          </div>
        </div>

        {/* Foundation & History details */}
        <div className="glass-card rounded-xl border border-white/5 bg-[#0d1118]/80 p-6 shadow-xl space-y-4">
          <h3 className="font-tech text-lg font-bold uppercase tracking-wider text-white">Foundation & Story</h3>
          <div className="space-y-1.5 max-w-md">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Section heading (above date)
            </label>
            <input
              type="text"
              value={homepage.founded.sectionTitle}
              onChange={(e) => patchHomepage("founded", { sectionTitle: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Founded Date Label
              </label>
              <input
                type="text"
                value={foundedLabel}
                onChange={(e) => setFoundedLabel(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                placeholder="e.g. March 2024"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Founded History Text / Story
              </label>
              <input
                type="text"
                value={foundedHistory}
                onChange={(e) => setFoundedHistory(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                placeholder="Describe how Lodus was formed..."
              />
            </div>
          </div>
        </div>

      </form>

      {portalReady &&
        isDirty &&
        createPortal(
          <div
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex justify-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            role="status"
            aria-live="polite"
          >
            <div className="pointer-events-auto flex w-full max-w-xl items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#111214]/95 p-3.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300">
              <span className="text-xs font-semibold text-white">
                Careful — you have unsaved changes!
              </span>
              <div className="flex shrink-0 items-center gap-4">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={pending}
                  className="text-xs font-semibold text-white transition-all hover:text-white/80 hover:underline disabled:opacity-50"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  form={SITE_SETTINGS_FORM_ID}
                  disabled={pending}
                  className="flex items-center gap-1.5 rounded bg-[#248046] px-4 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:bg-[#1a6535] disabled:opacity-50"
                >
                  {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
