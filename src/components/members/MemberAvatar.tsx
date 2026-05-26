import { getInitials } from "@/lib/utils";

export function MemberAvatar({
  name,
  avatarUrl,
  size = 64,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-full border-2 border-primary-container object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border-2 border-primary-container bg-surface-container-high font-semibold text-on-surface-variant"
      style={{ width: size, height: size, fontSize: size * 0.3 }}
    >
      {getInitials(name)}
    </div>
  );
}
