export function FoundedSection({
  foundedLabel,
  history,
}: {
  foundedLabel: string;
  history: string;
}) {
  return (
    <section id="founded" className="scroll-mt-24 py-16">
      <div className="glass-card relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-xl p-8 md:flex-row md:p-12">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary-container/50 to-transparent" />
        <div className="relative z-10">
          <h2 className="mb-2 text-sm uppercase tracking-widest text-on-surface-variant">
            When we started
          </h2>
          <div className="flex items-baseline gap-3">
            <div className="relative h-3 w-3 rounded-full bg-primary before:absolute before:-inset-1 before:rounded-full before:border before:border-primary/30" />
            <span className="text-2xl font-bold text-on-surface">{foundedLabel}</span>
          </div>
          <p className="mt-4 max-w-xl text-on-surface-variant">{history}</p>
        </div>
      </div>
    </section>
  );
}
