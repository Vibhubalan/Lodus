"use client";

import { ArrowRight } from "lucide-react";
import { useLightAnimations } from "@/lib/client/use-light-animations";

export function HeroSection({ tagline }: { tagline: string }) {
  const light = useLightAnimations();

  const scrollToTeam = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById("team");
    if (!target) return;
    target.scrollIntoView({ behavior: light ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", "#team");
  };

  return (
    <section className="hero-bg relative flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-6 py-8">
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-[clamp(0.75rem,2vh,1.25rem)] text-center">
        <h1 className="hero-animate hero-animate-delay-1 font-extrabold tracking-tight">
          Lodus
        </h1>

        <p className="hero-animate hero-animate-delay-2 max-w-2xl text-[clamp(1rem,1.2vw+0.75rem,1.25rem)] font-normal leading-relaxed text-on-surface-variant">
          {tagline}
        </p>

        <a
          href="#team"
          onClick={scrollToTeam}
          className="hero-animate hero-animate-delay-3 mt-2 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-[0_4px_24px_rgba(255,70,85,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_6px_32px_rgba(255,70,85,0.35)]"
        >
          Meet the team
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </a>
      </div>
    </section>
  );
}
