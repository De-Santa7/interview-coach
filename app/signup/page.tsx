"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage(): React.ReactElement {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "linkedin" | null>(null);

  const clientRef = useRef<ReturnType<typeof createClient> | null>(null);
  function getClient() {
    if (!clientRef.current) {
      const c = createClient();
      if (c) clientRef.current = c;
    }
    return clientRef.current;
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const client = getClient();
    if (!client) { setError("Supabase is not configured."); setLoading(false); return; }

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const { error: signUpError } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: fullName },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const { error: signInError } = await client.auth.signInWithPassword({ email, password });
    if (signInError) {
      setSuccess(true);
    } else {
      router.push("/");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleOAuth(provider: "google" | "linkedin") {
    setOauthLoading(provider);
    const client = getClient();
    if (!client) { setError("Supabase is not configured."); setOauthLoading(null); return; }
    const supabaseProvider = provider === "linkedin" ? "linkedin_oidc" : provider;
    const { error } = await client.auth.signInWithOAuth({
      provider: supabaseProvider as "google" | "linkedin_oidc",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setOauthLoading(null);
    }
  }

  if (success) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #fafaf8 0%, #f5f0e8 50%, #fafaf8 100%)" }}
      >
        <div className="blob blob-gold w-80 h-80 absolute" style={{ top: "-10%", right: "-10%", opacity: 0.12 }} />
        <div className="blob blob-teal w-64 h-64 absolute" style={{ bottom: "-10%", left: "-10%", opacity: 0.1 }} />
        <div
          className="w-full max-w-sm p-8 text-center relative z-10"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.5)",
            borderRadius: "20px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "linear-gradient(135deg, #06d6a0, #00b4d8)", boxShadow: "0 6px 24px rgba(6,214,160,0.3)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-charcoal mb-2" style={{ fontFamily: "var(--font-fraunces)" }}>
            Check your email ✉️
          </h2>
          <p className="text-sm text-body mb-6">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <Link href="/login" className="btn-primary inline-flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #fafaf8 0%, #f5f0e8 50%, #fafaf8 100%)" }}
    >
      {/* Background blobs */}
      <div className="blob blob-gold w-80 h-80 absolute" style={{ top: "-10%", right: "-10%", opacity: 0.12 }} />
      <div className="blob blob-teal w-64 h-64 absolute" style={{ bottom: "-10%", left: "-10%", opacity: 0.1 }} />

      {/* Logo */}
      <Link href="/" className="mb-8 block hover:opacity-90 transition-opacity relative z-10">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-card-md mb-3"
          style={{ background: "linear-gradient(135deg, #ffffff, #f8f6f0)", border: "1px solid var(--c-border)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="InterviewCoach" className="h-14 w-auto" />
        </div>
        <p className="text-center text-base font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
          <span className="text-charcoal">Interview</span>
          <span style={{ color: "#e8b923" }}>Coach</span>
        </p>
      </Link>

      <div className="w-full max-w-sm relative z-10">
        <div
          className="p-8"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.5)",
            borderRadius: "20px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
          }}
        >
          <h1 className="text-2xl font-semibold text-charcoal mb-1" style={{ fontFamily: "var(--font-fraunces)" }}>
            Create your account. 🚀
          </h1>
          <p className="text-sm text-body mb-7">Start practising interviews today — it&apos;s free.</p>

          {/* Error banner */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-danger-light border border-danger/20 rounded-xl text-sm text-danger flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* OAuth */}
          <div className="flex flex-col gap-3 mb-6">
            <button
              onClick={() => handleOAuth("google")}
              disabled={!!oauthLoading || loading}
              className="btn-secondary flex items-center justify-center gap-3 w-full !py-2.5 !rounded-xl"
            >
              {oauthLoading === "google" ? <LoadingDots /> : <><GoogleIcon /><span>Continue with Google</span></>}
            </button>
            <button
              onClick={() => handleOAuth("linkedin")}
              disabled={!!oauthLoading || loading}
              className="flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-xl text-white text-sm font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#0A66C2", boxShadow: "0 2px 8px rgba(10,102,194,0.25)" }}
              onMouseEnter={(e) => { if (!oauthLoading && !loading) e.currentTarget.style.backgroundColor = "#004182"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#0A66C2"; }}
            >
              {oauthLoading === "linkedin" ? <LoadingDots light /> : <><LinkedInIcon /><span>Continue with LinkedIn</span></>}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted font-mono tracking-wider uppercase">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label block mb-1.5">First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-field"
                  placeholder="Jane"
                  required
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label className="label block mb-1.5">Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-field"
                  placeholder="Smith"
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>

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
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
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

            <div>
              <label className="label block mb-1.5">Confirm password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`input-field pr-11 ${
                    confirmPassword && confirmPassword !== password
                      ? "border-danger focus:border-danger"
                      : ""
                  }`}
                  placeholder="Repeat your password"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-body transition-colors"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="mt-1 text-xs text-danger flex items-center gap-1">
                  <span>⚠️</span> Passwords don&apos;t match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !!oauthLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-1 !rounded-xl"
            >
              {loading ? <LoadingDots light /> : "Create account →"}
            </button>
          </form>

          <p className="text-xs text-muted text-center mt-5 leading-relaxed">
            By creating an account you agree to our{" "}
            <span className="text-body">Terms of Service</span> and{" "}
            <span className="text-body">Privacy Policy</span>.
          </p>
        </div>

        <p className="text-center text-sm text-body mt-5">
          Already have an account?{" "}
          <Link href="/login" className="font-medium transition-colors" style={{ color: "#e8b923" }}>
            Sign in
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
          className={`w-1.5 h-1.5 rounded-full ${light ? "bg-white" : "bg-charcoal"}`}
          style={{ animation: `bounce-dot 1.4s ease-in-out ${i * 0.2}s infinite` }}
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

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
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
