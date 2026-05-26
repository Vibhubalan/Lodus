import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function HeroSection({ tagline }: { tagline: string }) {
  return (
    <section className="hero-bg glass-card relative flex min-h-[70vh] items-center justify-center overflow-hidden rounded-xl p-8 md:p-12">
      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='2' fill='%231c1b1b' fill-opacity='0.1'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <h1 className="text-5xl font-semibold tracking-tight text-on-surface md:text-6xl">Lodus</h1>
        <p className="text-2xl font-light text-on-surface-variant">{tagline}</p>
        <Link
          href="#leadership"
          className="mt-2 inline-flex items-center gap-2 rounded bg-on-surface px-6 py-3 text-xs font-semibold uppercase tracking-wider text-on-primary shadow-sm transition-colors hover:opacity-90"
        >
          Meet the team
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
