"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { PasswordField } from "@/components/auth/PasswordField";
import {
  changePassword,
  sendPasswordResetOTP,
} from "@/app/profile/actions";

type PasswordResetFormProps = {
  userId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function PasswordResetForm({
  userId,
  onSuccess,
  onCancel,
  submitLabel = "Update Password",
}: PasswordResetFormProps) {
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const passwordsMatch =
    newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;

  async function handleSendOtp() {
    setOtpLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await sendPasswordResetOTP(userId);
      if (!res.ok) {
        setError(res.error ?? "Failed to send verification code.");
        return;
      }
      setOtpSent(true);
      setMessage(res.message ?? "Verification code sent to your email.");
    } catch {
      setError("Could not send verification code. Try again.");
    } finally {
      setOtpLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!otpSent) {
      setError("Send a verification code to your email first.");
      return;
    }
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
        fd.set("otpCode", otpCode);
        fd.set("newPassword", newPassword);
        fd.set("confirmPassword", confirmPassword);
        const res = await changePassword(fd);
        if (!res.ok) {
          setError(res.error ?? "Failed to update password.");
          return;
        }
        if (res.ok) {
          setMessage("message" in res && res.message ? res.message : "Password updated.");
        }
        setOtpCode("");
        setNewPassword("");
        setConfirmPassword("");
        setOtpSent(false);
        onSuccess?.();
      } catch {
        setError("Could not update password. Try again.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-on-surface-variant leading-relaxed">
        Step 1: send a verification code to your email. Step 2: enter the code and choose a new
        password.
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

      <div className="rounded-lg border border-white/10 bg-black/20 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            1. Email verification code
          </span>
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={otpLoading || pending}
            className="text-xs font-bold uppercase tracking-wider text-primary hover:text-primary-dim disabled:opacity-50"
          >
            {otpLoading ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Sending…
              </span>
            ) : otpSent ? (
              "Resend code"
            ) : (
              "Send code to email"
            )}
          </button>
        </div>
        <input
          type="text"
          name="otpCode"
          inputMode="numeric"
          maxLength={6}
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="6-digit code"
          disabled={!otpSent}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-center font-mono text-sm tracking-[0.3em] text-white disabled:opacity-40"
        />
      </div>

      <div
        className={`space-y-3 rounded-lg border border-white/10 bg-black/20 p-4 ${!otpSent ? "opacity-40 pointer-events-none" : ""}`}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
          2. New password
        </span>
        <PasswordField
          id="reset-new-password"
          name="newPassword"
          label="New Password"
          value={newPassword}
          onChange={setNewPassword}
          minLength={8}
          autoComplete="new-password"
        />
        <PasswordField
          id="reset-confirm-password"
          name="confirmPassword"
          label="Confirm New Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          minLength={8}
          autoComplete="new-password"
        />
        {newPassword && confirmPassword && !passwordsMatch ? (
          <p className="text-[11px] text-red-400 font-semibold">Passwords do not match.</p>
        ) : null}
      </div>

      <div className="flex justify-end gap-3 pt-1">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={pending || !otpSent || otpCode.length !== 6 || !passwordsMatch}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-500 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
