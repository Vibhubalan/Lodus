"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PasswordField } from "@/components/auth/PasswordField";
import {
  completePasswordResetByEmail,
  requestPasswordResetForEmail,
} from "@/app/profile/actions";

type ForgotPasswordPanelProps = {
  initialEmail?: string;
  onBack: () => void;
};

export function ForgotPasswordPanel({ initialEmail = "", onBack }: ForgotPasswordPanelProps) {
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState(initialEmail);
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const passwordsMatch =
    newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;

  function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        const res = await requestPasswordResetForEmail(email);
        if (!res.ok) {
          setError(res.error ?? "Could not send verification code.");
          return;
        }
        setMessage(res.message ?? "If an account exists, a code was sent.");
        setStep("reset");
      } catch {
        setError("Could not send verification code. Try again.");
      }
    });
  }

  function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("email", email.trim().toLowerCase());
        fd.set("otpCode", otpCode);
        fd.set("newPassword", newPassword);
        fd.set("confirmPassword", confirmPassword);
        const res = await completePasswordResetByEmail(fd);
        if (!res.ok) {
          setError(res.error ?? "Could not reset password.");
          return;
        }
        setMessage(res.message ?? "Password updated. You can sign in now.");
        setTimeout(() => onBack(), 1500);
      } catch {
        setError("Could not reset password. Try again.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to login
      </button>

      <p className="text-xs text-on-surface-variant leading-relaxed">
        {step === "email"
          ? "Enter your email and we will send a verification code."
          : "Enter the code from your email, then choose a new password."}
      </p>

      {error ? (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs text-green-400">
          {message}
        </p>
      ) : null}

      {step === "email" ? (
        <form onSubmit={handleRequestCode} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@gmail.com"
              required
              autoComplete="email"
              className="w-full rounded-lg py-2.5 px-4 text-sm text-white auth-input-override"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-red-600 py-3 text-sm font-semibold uppercase tracking-wider text-white hover:bg-red-500 disabled:opacity-50"
          >
            {pending ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Sending…
              </span>
            ) : (
              "Send verification code"
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Verification code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit code"
              required
              className="w-full rounded-lg py-2.5 px-4 text-center font-mono text-sm tracking-[0.3em] text-white auth-input-override"
            />
          </div>
          <PasswordField
            id="forgot-new-password"
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            minLength={8}
            autoComplete="new-password"
          />
          <PasswordField
            id="forgot-confirm-password"
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            minLength={8}
            autoComplete="new-password"
          />
          {newPassword && confirmPassword && !passwordsMatch ? (
            <p className="text-[11px] text-red-400 font-semibold">Passwords do not match.</p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setOtpCode("");
                setNewPassword("");
                setConfirmPassword("");
                setError("");
                setMessage("");
              }}
              className="flex-1 rounded-lg border border-white/10 py-2.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
            >
              Change email
            </button>
            <button
              type="submit"
              disabled={pending || otpCode.length !== 6 || !passwordsMatch}
              className="flex-1 rounded-lg bg-red-600 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-500 disabled:opacity-50"
            >
              {pending ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </span>
              ) : (
                "Reset password"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
