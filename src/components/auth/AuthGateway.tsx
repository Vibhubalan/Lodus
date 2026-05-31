"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { submitMemberApplication } from "@/app/auth/actions";
import { PasswordField } from "@/components/auth/PasswordField";
import { ForgotPasswordPanel } from "@/components/auth/ForgotPasswordPanel";
import { AutofillTrap } from "@/components/forms/anti-autofill";
import { toUserAuthError } from "@/lib/auth/error-messages";
import { 
  Mail, 
  ArrowRight, 
  AlertCircle,
  CheckCircle
} from "lucide-react";
import type { Session } from "next-auth";

type Tab = "signin" | "signup" | "admin";

export function AuthGateway({
  session,
  callbackUrl,
  googleAuthEnabled = false,
  adminError,
  initialTab = "signin",
  mode = "full",
}: {
  session: Session | null;
  callbackUrl: string;
  googleAuthEnabled?: boolean;
  adminError?: string | null;
  initialTab?: Tab;
  /** admin-only: secret portal — no member Sign-in / Sign-up tabs */
  mode?: "full" | "admin-only";
}) {
  // Tab & Form states
  const [activeTab, setActiveTab] = useState<Tab>(mode === "admin-only" ? "admin" : initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [prevInitialTab, setPrevInitialTab] = useState<Tab>(initialTab);
  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab);
    setActiveTab(initialTab);
  }

  const [prevAdminError, setPrevAdminError] = useState<string | null | undefined>(adminError);
  if (adminError !== prevAdminError) {
    setPrevAdminError(adminError);
    if (adminError === "denied") {
      setActiveTab("admin");
      setError(toUserAuthError("AccessDenied"));
    } else if (adminError === "gmail-only") {
      setActiveTab("admin");
      setError("Please use Google sign-in to continue.");
    }
  }

  // Auth submits
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (activeTab === "signup") {
        const result = await submitMemberApplication({
          email,
          message: applicationMessage,
        });
        if (result.redirectToSetup && result.token) {
          window.location.href = `/profile/setup?token=${result.token}`;
          return;
        }
        if (!result.ok) {
          setError(toUserAuthError(result.error));
          setLoading(false);
          return;
        }
        setSuccess(
          "Application submitted! Check your email to verify, then wait for approval. Once approved, you will receive a registration link.",
        );
        setActiveTab("signin");
        setLoading(false);
        return;
      }

      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setError(toUserAuthError(res.error));
        setLoading(false);
        return;
      }

      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      setError(toUserAuthError(err instanceof Error ? err.message : null));
    } finally {
      setLoading(false);
    }
  };

  const handleAdminGoogleSignIn = () => {
    setError("");
    setSuccess("");
    if (!googleAuthEnabled) {
      setError(toUserAuthError("Configuration"));
      return;
    }
    document.cookie = "lodus_admin_oauth=1; path=/; max-age=300; SameSite=Lax";
    setLoading(true);
    signIn("google", { callbackUrl });
  };

  const tabs: Tab[] = mode === "admin-only" ? ["admin"] : ["signin", "signup", "admin"];
  const activeIndex = tabs.indexOf(activeTab);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0B0B0F] px-4">
      {/* Immersive Crimson Glow */}
      <div 
        className="pointer-events-none absolute left-0 right-0 top-0 h-[50vh] opacity-80"
        style={{
          backgroundImage: "radial-gradient(circle at 50% 0%, rgba(239, 68, 68, 0.12) 0%, transparent 60%)",
        }}
      />

      {/* Brand Header */}
      <header className="absolute left-6 top-6 z-10 md:left-16 lg:left-24">
        <Link href="/" className="logo-font logo-link text-3xl font-bold tracking-widest">
          Lodus
        </Link>
      </header>

      {/* Main Interaction Area */}
      <div className="relative z-10 w-full max-w-md">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d1118]/70 p-8 shadow-2xl backdrop-blur-xl">
          {/* Sliding Tab Header */}
          {mode === "full" ? (
          <div className="relative mb-8 flex rounded-lg bg-[#07090d]/80 p-1">
            {/* Sliding indicator */}
            <div 
              className="absolute bottom-1 top-1 left-1 bg-white/5 border border-white/10 rounded-md transition-all duration-300 cubic-bezier(0.25,1,0.5,1)"
              style={{
                width: `calc(${100 / tabs.length}% - 4px)`,
                transform: `translateX(${activeIndex * 100}%)`,
              }}
            />

            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setActiveTab(t);
                  setError("");
                  setSuccess("");
                }}
                className={`relative z-10 flex-1 py-2 text-xs font-bold uppercase tracking-widest text-center transition-colors duration-300 ${
                  activeTab === t 
                    ? "text-[#ece8ea]" 
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {t === "signin" ? "Login" : t === "signup" ? "Sign Up" : "Admin"}
              </button>
            ))}
          </div>
          ) : (
            <div className="mb-8 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Admin portal
              </p>
              <h1 className="mt-2 font-tech text-2xl font-bold tracking-wide text-on-surface">
                Sign in
              </h1>
            </div>
          )}

          {/* Success / Error notification */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-xs text-red-400 font-mono">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2.5 text-xs text-green-400 font-mono">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {mode === "full" && activeTab === "signin" && showForgotPassword ? (
            <ForgotPasswordPanel
              initialEmail={email}
              onBack={() => {
                setShowForgotPassword(false);
                setError("");
                setSuccess("");
              }}
            />
          ) : null}

          {/* Sign In & Sign Up Form Panels */}
          {mode === "full" && activeTab !== "admin" && !(activeTab === "signin" && showForgotPassword) ? (
            <form onSubmit={handleAuth} className="space-y-4" autoComplete="off">
              <AutofillTrap />
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    required
                    autoComplete="off"
                    name={activeTab === "signup" ? "lodus-gmail-application" : "lodus-email-field"}
                    readOnly
                    onFocus={(e) => {
                      e.target.readOnly = false;
                    }}
                    className="w-full rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-red-500/50 auth-input-override"
                  />
                </div>
              </div>

              {activeTab === "signin" && (
                <>
                  <PasswordField
                    id="lodus-password"
                    label="Password"
                    value={password}
                    onChange={setPassword}
                    minLength={8}
                    autoComplete="off"
                  />
                  <div className="flex justify-end -mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setError("");
                        setSuccess("");
                      }}
                      className="text-[11px] font-semibold text-primary hover:text-primary-dim"
                    >
                      Forgot password?
                    </button>
                  </div>
                </>
              )}

              {activeTab === "signup" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Why join Lodus?
                  </label>
                  <textarea
                    value={applicationMessage}
                    onChange={(e) => setApplicationMessage(e.target.value)}
                    rows={3}
                    required
                    autoComplete="off"
                    className="w-full rounded-lg p-3 text-sm text-white auth-input-override resize-none"
                    placeholder="Please write a brief reason why you would like to join Lodus..."
                  />
                </div>
              )}

              {activeTab === "signin" && (
                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] hover:bg-red-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.45)] active:scale-[0.98] transition-all duration-200 disabled:opacity-60"
                  >
                    {loading ? "Processing..." : "Login"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {activeTab === "signup" && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] hover:bg-red-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.45)] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 pt-2"
                >
                  {loading ? "Processing..." : "Apply for membership"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </form>
          ) : activeTab === "admin" || mode === "admin-only" ? (
            <div className="space-y-4">
              {!session?.user ? (
                <div className="space-y-5">
                  <button
                    type="button"
                    onClick={handleAdminGoogleSignIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 rounded-lg border border-white/10 bg-[#121620]/80 py-3.5 text-sm font-semibold text-[#ece8ea] hover:bg-[#121620] transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    {loading ? "Redirecting to Google…" : "Sign in with Gmail"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                /* Authenticated State Display */
                <div className="space-y-5 text-center">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Logged In
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed text-left py-2">
                    You are authenticated as <strong className="text-white">{session.user.name ?? session.user.email}</strong>.
                  </p>
                  <Link 
                    href="/" 
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] hover:bg-red-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.45)] active:scale-[0.98] transition-all duration-200"
                  >
                    Enter dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
