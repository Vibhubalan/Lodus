"use client";

import { Phone } from "lucide-react";
import { COUNTRY_DIAL_OPTIONS } from "@/lib/phone/country-codes";

type PhoneCountryInputProps = {
  dialCode: string;
  localNumber: string;
  onDialCodeChange: (dial: string) => void;
  onLocalNumberChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
};

export function PhoneCountryInput({
  dialCode,
  localNumber,
  onDialCodeChange,
  onLocalNumberChange,
  required = false,
  disabled = false,
}: PhoneCountryInputProps) {
  return (
    <div className="flex gap-2">
      <div className="relative w-[42%] min-w-[7.5rem] sm:w-[38%]">
        <select
          name="phoneDialCode"
          value={dialCode}
          onChange={(e) => onDialCodeChange(e.target.value)}
          required={required}
          disabled={disabled}
          className="w-full appearance-none rounded-lg border border-white/10 bg-black/30 py-2.5 pl-3 pr-8 text-sm text-white focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/50 auth-input-override"
        >
          {COUNTRY_DIAL_OPTIONS.map((c) => (
            <option key={`${c.code}-${c.dial}`} value={c.dial}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="relative min-w-0 flex-1">
        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/40" />
        <input
          type="tel"
          name="phoneLocal"
          value={localNumber}
          onChange={(e) => onLocalNumberChange(e.target.value)}
          required={required}
          disabled={disabled}
          autoComplete="tel-national"
          data-lpignore="true"
          placeholder="98765 43210"
          className="w-full rounded-lg border border-white/10 bg-black/30 py-2.5 pl-10 pr-3 text-sm text-white placeholder-on-surface-variant/40 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/50 auth-input-override"
        />
      </div>
    </div>
  );
}
