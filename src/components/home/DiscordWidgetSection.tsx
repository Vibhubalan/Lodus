import { DiscordChatPreview } from "@/components/DiscordChatPreview";
import { DiscordVoicePreview } from "@/components/DiscordVoicePreview";

export function DiscordWidgetSection({
  title = "Community",
  subtitle = "Live preview of the latest messages from our Discord channel.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <section id="discord" className="scroll-mt-4">
      <div className="mb-5">
        <h2 className="text-2xl font-medium text-on-surface">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">{subtitle}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DiscordChatPreview className="h-[360px] lg:h-[390px]" />
        <DiscordVoicePreview className="h-[360px] lg:h-[390px]" />
      </div>
    </section>
  );
}
