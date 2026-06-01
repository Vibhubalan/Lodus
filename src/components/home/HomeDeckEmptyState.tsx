export function HomeDeckEmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
      <h3 className="font-tech text-xl font-bold uppercase tracking-wider text-on-surface">{title}</h3>
      {subtitle ? (
        <p className="mt-2 text-sm text-on-surface-variant">{subtitle}</p>
      ) : null}
      <p className="mt-4 text-xs text-on-surface-variant/80">
        No members in this deck yet.
      </p>
    </div>
  );
}
