import { Mail } from "lucide-react";
import { DonationSection } from "@/components/home/DonationSection";
import { Suspense } from "react";
import { DonationStatusBanner } from "@/components/home/DonationStatusBanner";
import { getAdminEmail } from "@/lib/auth/staff";
import { isDonationsEnabled } from "@/lib/features";
export function PublicFooter({
  brandName = "Lodus",
  copyrightText,
  discordLabel = "Discord",
  emailLabel,
  hidden = false,
}: {
  brandName?: string;
  copyrightText?: string;
  discordLabel?: string;
  emailLabel?: string;
  hidden?: boolean;
}) {
  const discordInvite =
    process.env.NEXT_PUBLIC_DISCORD_INVITE_URL?.trim() ||
    "https://discord.gg";
  const adminEmail = getAdminEmail();
  const year = new Date().getFullYear();
  const copyright =
    copyrightText?.replace(/\{\{year\}\}/g, String(year)) ??
    `© ${year} All rights reserved.`;
  const emailDisplay = emailLabel?.trim() || adminEmail;

  if (hidden) return null;

  const showDonations = isDonationsEnabled();

  return (    <footer className="w-full border-0 bg-transparent shadow-none">
      <div className="flex w-full flex-col gap-4 px-3 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-5 md:px-6">
        <div className="flex w-full flex-col items-start sm:w-auto">
          {showDonations ? (
            <>
              <Suspense fallback={null}>
                <DonationStatusBanner />
              </Suspense>
              <DonationSection />
            </>
          ) : null}          <span className="logo-font text-[clamp(1rem,1.5vw+0.5rem,1.125rem)] font-bold tracking-wide text-on-surface">
            {brandName}
          </span>
          <span className="mt-0.5 text-xs text-on-surface-variant">{copyright}</span>
        </div>

        <div
          data-allow-copy
          className="flex w-full items-center justify-end gap-6 sm:w-auto"
        >
          <a
            href={discordInvite}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant transition-colors duration-200 hover:text-primary focus:outline-none"
          >
            <svg
              className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
              viewBox="0 0 127.14 96.36"
              fill="currentColor"
              aria-hidden
            >
              <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,52.8,6.83,77.19,77.19,0,0,0,49.5,0,105.15,105.15,0,0,0,19.06,8.07C3.82,30.56-4,52.48,2.42,73.89a105.81,105.81,0,0,0,32,16.09,79,79,0,0,0,6.77-11,68.7,68.7,0,0,1-10.64-5.12c.91-.67,1.81-1.37,2.67-2.1a75.44,75.44,0,0,0,84.4,0c.87.73,1.76,1.43,2.68,2.1a68.86,68.86,0,0,1-10.65,5.13,79.08,79.08,0,0,0,6.77,11,105.9,105.9,0,0,0,32-16.09C130.82,52.48,122.56,30.56,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
            </svg>
            <span>{discordLabel}</span>
          </a>
          <a
            href={`mailto:${adminEmail}`}
            className="group flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant transition-colors duration-200 hover:text-primary focus:outline-none"
          >
            <Mail className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
            <span className="select-text normal-case">{emailDisplay}</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
