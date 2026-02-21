"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage(): React.ReactElement {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(authError === "auth" ? "Authentication failed. Please try again." : "");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);

  const clientRef = useRef<ReturnType<typeof createClient> | null>(null);
  function getClient() {
    if (!clientRef.current) {
      const c = createClient();
      if (c) clientRef.current = c;
    }
    return clientRef.current;
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const client = getClient();
    if (!client) { setError("Supabase is not configured."); setLoading(false); return; }
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  async function handleOAuth(provider: "google" | "apple") {
    setOauthLoading(provider);
    const client = getClient();
    if (!client) { setError("Supabase is not configured."); setOauthLoading(null); return; }
    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setOauthLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-16">
      {/* Logo */}
      <Link href="/login" className="flex items-center gap-2.5 mb-10 group">
        <span className="w-8 h-8 rounded-md bg-accent flex items-center justify-center text-white text-xs font-bold shadow-sm">
          IC
        </span>
        <span
          className="text-lg font-semibold text-charcoal group-hover:text-accent transition-colors"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          InterviewCoach
        </span>
      </Link>

      <div className="w-full max-w-sm">
        <div className="card-md p-8">
          <h1
            className="text-2xl font-semibold text-charcoal mb-1"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Welcome back.
          </h1>
          <p className="text-sm text-body mb-7">Sign in to continue your practice.</p>

          {/* Error banner */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-danger-light border border-danger/20 rounded-md text-sm text-danger">
              {error}
            </div>
          )}

          {/* OAuth buttons */}
          <div className="flex flex-col gap-3 mb-6">
            <button
              onClick={() => handleOAuth("google")}
              disabled={!!oauthLoading || loading}
              className="btn-secondary flex items-center justify-center gap-3 w-full !py-2.5"
            >
              {oauthLoading === "google" ? (
                <LoadingDots />
              ) : (
                <>
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleOAuth("apple")}
              disabled={!!oauthLoading || loading}
              className="flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-md bg-charcoal hover:bg-[#2d2d30] text-white text-sm font-medium transition-all duration-150 border border-charcoal disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {oauthLoading === "apple" ? (
                <LoadingDots light />
              ) : (
                <>
                  <AppleIcon />
                  <span>Continue with Apple</span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted font-mono tracking-wider uppercase">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <div>
              <label className="label block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-11"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-body transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !!oauthLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-1"
            >
              {loading ? <LoadingDots light /> : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-body mt-5">
          No account?{" "}
          <Link href="/signup" className="text-accent hover:text-accent-hover font-medium transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

function LoadingDots({ light = false }: { light?: boolean }) {
  return (
    <span className="flex gap-1 items-center h-4">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full animate-bounce-dot ${light ? "bg-white" : "bg-charcoal"}`}
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 814 1000" fill="currentColor">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.3-164-39.3c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-127.4C46.7 790.7 0 663 0 541.8c0-207.3 135.3-317 268.1-317 63.2 0 115.9 41.6 155.5 41.6 37.8 0 97.9-43.9 168.8-43.9 68.2 0 137.2 25 183.7 93.5zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}
