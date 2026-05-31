export type CountryDialOption = {
  code: string;
  dial: string;
  label: string;
};

/** Common dial codes for the profile phone field (dial stored without +). */
export const COUNTRY_DIAL_OPTIONS: CountryDialOption[] = [
  { code: "IN", dial: "91", label: "India (+91)" },
  { code: "US", dial: "1", label: "United States (+1)" },
  { code: "GB", dial: "44", label: "United Kingdom (+44)" },
  { code: "CA", dial: "1", label: "Canada (+1)" },
  { code: "AU", dial: "61", label: "Australia (+61)" },
  { code: "DE", dial: "49", label: "Germany (+49)" },
  { code: "FR", dial: "33", label: "France (+33)" },
  { code: "AE", dial: "971", label: "UAE (+971)" },
  { code: "SG", dial: "65", label: "Singapore (+65)" },
  { code: "MY", dial: "60", label: "Malaysia (+60)" },
  { code: "PH", dial: "63", label: "Philippines (+63)" },
  { code: "PK", dial: "92", label: "Pakistan (+92)" },
  { code: "BD", dial: "880", label: "Bangladesh (+880)" },
  { code: "LK", dial: "94", label: "Sri Lanka (+94)" },
  { code: "NP", dial: "977", label: "Nepal (+977)" },
  { code: "JP", dial: "81", label: "Japan (+81)" },
  { code: "KR", dial: "82", label: "South Korea (+82)" },
  { code: "BR", dial: "55", label: "Brazil (+55)" },
  { code: "MX", dial: "52", label: "Mexico (+52)" },
  { code: "ZA", dial: "27", label: "South Africa (+27)" },
];

export function formatPhoneWithDialCode(dialCode: string, localNumber: string): string {
  const dial = dialCode.replace(/\D/g, "");
  const local = localNumber.replace(/\D/g, "");
  if (!dial || !local) return "";
  return `+${dial}${local}`;
}

export function parsePhoneWithDialCode(
  phone: string | null | undefined,
): { dialCode: string; localNumber: string } {
  const raw = (phone ?? "").trim();
  if (!raw) return { dialCode: "91", localNumber: "" };

  const digits = raw.replace(/\D/g, "");
  if (!digits) return { dialCode: "91", localNumber: "" };

  const sorted = [...COUNTRY_DIAL_OPTIONS].sort((a, b) => b.dial.length - a.dial.length);
  for (const option of sorted) {
    if (digits.startsWith(option.dial)) {
      return {
        dialCode: option.dial,
        localNumber: digits.slice(option.dial.length),
      };
    }
  }

  return { dialCode: "91", localNumber: digits };
}
