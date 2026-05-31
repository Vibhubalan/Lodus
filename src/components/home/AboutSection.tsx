import {
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
import { SafeDisplayImage } from "@/components/ui/SafeDisplayImage";

export const HIGHLIGHT_ICONS: Record<string, React.ComponentType<any>> = {
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

interface AboutSectionProps {
  title?: string;
  imageUrl?: string;
  aboutMarkdown?: string;
  highlightsJson?: string;
}

export function AboutSection({
  title = "About Lodus",
  imageUrl = "/images/about/lodus-photo.png",
  aboutMarkdown,
  highlightsJson,
}: AboutSectionProps) {
  let highlights = [
    { icon: "calendar", label: "Daily Gandmastis" },
    { icon: "flame", label: "UNC - Energy" },
    { icon: "history", label: "Since 2021" },
  ];
  if (highlightsJson) {
    try {
      const parsed = JSON.parse(highlightsJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        highlights = parsed;
      }
    } catch (e) {
      // ignore
    }
  }

  const copy = aboutMarkdown || `We are just a bunch of absolute uncs sitting here looking completely jobless—Morning morning ushna happens means we are already inside VC doing full gandmasti, and then as usual everyone will just deafen and sit for attention (Ahan). Then we say we play so different games, but the real ushna is that we end up playing only Valo only like total losers. No other scene happens here throughout the day-just some games, random gandmasti and the uncs constantly shagging each other's cocks. Also, this server is a total sausage fest with zero foids, so don't expect a lot here.`;

  return (
    <section id="about" className="scroll-mt-4">
      <div className="grid gap-6 md:grid-cols-12 md:gap-8">
        <h2 className="text-2xl font-medium text-on-surface md:col-span-4">{title}</h2>
        <div className="hidden md:block md:col-span-8" aria-hidden="true" />

        <div className="h-full md:col-span-4">
          <SafeDisplayImage
            src={imageUrl}
            alt={title}
            width={480}
            height={640}
            wrapperClassName="aspect-[3/4] w-full max-w-[240px] overflow-hidden rounded-lg md:aspect-auto md:h-full md:min-h-[300px] md:max-w-full"
            className="object-cover object-center"
            unoptimized={imageUrl.startsWith("http")}
          />
        </div>

        <div className="space-y-4 md:col-span-8">
          <div className="glass-card rounded-lg p-5 md:p-6">
            {copy.split("\n\n").map((para, i) => (
              <p
                key={i}
                className="text-sm leading-relaxed text-on-surface-variant md:text-[0.9375rem] md:leading-[1.65] not-last:mb-3"
              >
                {para}
              </p>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {highlights.map(({ icon, label }) => {
              const IconComponent = HIGHLIGHT_ICONS[icon.toLowerCase()] || Info;
              return (
                <div
                  key={label}
                  className="glass-card rounded border-l-2 border-l-primary p-3.5"
                >
                  <IconComponent className="mb-1.5 h-4 w-4 text-primary" />
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
