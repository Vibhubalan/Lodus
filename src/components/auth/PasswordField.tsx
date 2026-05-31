"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";

export function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder = "••••••••",
  required = true,
  minLength,
  autoComplete = "off",
  name,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  name?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
        {label}
      </label>
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/40" />
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          readOnly
          onFocus={(e) => {
            if (e.currentTarget.readOnly) e.currentTarget.readOnly = false;
          }}
          data-lpignore="true"
          data-1p-ignore="true"
          data-form-type="other"
          className="w-full rounded-lg py-2.5 pl-10 pr-11 text-sm text-white placeholder-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-red-500/50 auth-input-override"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
