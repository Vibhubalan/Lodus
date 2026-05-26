"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [email, setEmail] = useState("");
  const devMode = process.env.NEXT_PUBLIC_AUTH_DEV_MODE === "true";

  return (
    <div className="mt-8 space-y-4">
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl })}
        className="w-full rounded bg-on-surface py-3 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
      >
        Continue with Google
      </button>
      <button
        type="button"
        onClick={() => signIn("github", { callbackUrl })}
        className="w-full rounded border border-outline-variant py-3 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
      >
        Continue with GitHub
      </button>
      {devMode && (
        <form
          className="space-y-3 border-t border-outline-variant/40 pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            signIn("credentials", { email, callbackUrl });
          }}
        >
          <p className="text-xs text-on-surface-variant">Dev login (AUTH_DEV_MODE)</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full rounded border border-outline-variant bg-white px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            className="w-full rounded bg-primary py-2 text-sm font-medium text-on-primary"
          >
            Dev sign in
          </button>
        </form>
      )}
    </div>
  );
}
