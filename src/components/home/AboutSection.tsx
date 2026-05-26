import { Calendar, History, Monitor } from "lucide-react";

export function AboutSection({
  about,
  foundedLabel,
}: {
  about: string;
  foundedLabel: string;
}) {
  const paragraphs = about.split("\n\n").filter(Boolean);

  return (
    <section id="about" className="scroll-mt-24 pt-16">
      <div className="grid gap-8 md:grid-cols-12">
        <div className="md:col-span-4">
          <h2 className="sticky top-32 text-2xl font-medium text-on-surface">About Lodus</h2>
        </div>
        <div className="space-y-6 md:col-span-8">
          <div className="glass-card rounded-lg p-6">
            {paragraphs.map((p, i) => (
              <p key={i} className={`text-on-surface-variant ${i > 0 ? "mt-4" : ""}`}>
                {p}
              </p>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Calendar, label: "Weekly Sessions" },
              { icon: Monitor, label: "Multi-platform" },
              { icon: History, label: `Since ${foundedLabel.split(" ").pop()}` },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="glass-card rounded border-l-2 border-l-primary p-4">
                <Icon className="mb-2 h-5 w-5 text-primary" />
                <span className="block text-xs font-semibold uppercase tracking-wider text-on-surface">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
