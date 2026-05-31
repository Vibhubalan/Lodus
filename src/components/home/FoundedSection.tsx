export function FoundedSection({
  foundedLabel,
  history,
  sectionTitle = "When we started",
}: {
  foundedLabel: string;
  history: string;
  sectionTitle?: string;
}) {
  return (
    <section id="founded" className="scroll-mt-4">
      <div className="glass-card relative flex flex-col items-center justify-between gap-4 overflow-hidden rounded-xl p-6 md:flex-row md:p-8">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary-container/50 to-transparent" />
        <div className="relative z-10">
          <h2 className="mb-2 text-sm uppercase tracking-widest text-on-surface-variant">
            {sectionTitle}
          </h2>
          <div className="flex items-start gap-3">
            <div className="relative mt-1.5 h-3 w-3 shrink-0 rounded-full bg-primary before:absolute before:-inset-1 before:rounded-full before:border before:border-primary/30" />
            <span className="text-lg font-bold leading-snug text-on-surface sm:text-xl">
              {foundedLabel}
            </span>
          </div>
          <p className="mt-4 max-w-xl text-on-surface-variant">{history}</p>
        </div>
      </div>
    </section>
  );
}
