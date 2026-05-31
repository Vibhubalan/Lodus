"use client";

import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

/** Hidden fields that absorb browser password-manager suggestions. */
export function AutofillTrap() {
  return (
    <div className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0" aria-hidden>
      <input type="text" name="username" tabIndex={-1} autoComplete="username" defaultValue="" readOnly />
      <input type="password" name="password" tabIndex={-1} autoComplete="current-password" defaultValue="" readOnly />
    </div>
  );
}

type AntiInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export function AntiAutofillInput({ label, hint, className = "", onFocus, ...props }: AntiInputProps) {
  return (
    <div className="space-y-1">
      {label ? (
        <label htmlFor={props.id} className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          {label}
        </label>
      ) : null}
      <input
        {...props}
        autoComplete={props.autoComplete ?? "off"}
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-lpignore="true"
        data-1p-ignore="true"
        data-form-type="other"
        onFocus={(e) => {
          if (e.target.readOnly) e.target.readOnly = false;
          onFocus?.(e);
        }}
        className={`w-full rounded-lg border border-white/10 bg-[#07090d]/80 px-4 py-3 text-sm text-white placeholder-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-red-500/50 auth-input-override ${className}`}
      />
      {hint ? <p className="text-xs text-on-surface-variant">{hint}</p> : null}
    </div>
  );
}

export function AntiAutofillTextarea({
  label,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div className="space-y-1">
      {label ? (
        <label htmlFor={props.id} className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          {label}
        </label>
      ) : null}
      <textarea
        {...props}
        autoComplete="off"
        data-lpignore="true"
        data-1p-ignore="true"
        className={`w-full rounded-lg border border-white/10 bg-[#07090d]/80 p-3 text-sm text-white placeholder-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-red-500/50 auth-input-override resize-none ${className}`}
      />
    </div>
  );
}

export function AntiAutofillForm({
  children,
  className = "",
  ...props
}: React.FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form {...props} autoComplete="off" className={className}>
      <AutofillTrap />
      {children}
    </form>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-tech text-xl font-bold uppercase tracking-wider text-on-surface">{title}</h2>
        {description ? <p className="mt-2 text-sm text-on-surface-variant">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
