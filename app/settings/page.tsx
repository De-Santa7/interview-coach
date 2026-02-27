"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import {
  UserStats,
  loadUserStats,
  getRank,
  getProgressToNextRank,
  RANKS,
} from "@/lib/user-stats";

type Provider = "google" | "apple" | "email";

function getProvider(user: User): Provider {
  const identity = user.identities?.[0]?.provider;
  if (identity === "google") return "google";
  if (identity === "apple") return "apple";
  return "email";
}

function getInitials(name: string | undefined, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }
  return email[0].toUpperCase();
}

const PROVIDER_LABELS: Record<Provider, string> = {
  google: "Google",
  apple: "Apple",
  email: "Email & Password",
};

const PROVIDER_ICONS: Record<Provider, React.ReactElement> = {
  google: (
    <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  ),
  apple: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  ),
  email: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
};

/* ── Stat card ─────────────────────────────────── */
function StatCard({ label, value, icon, gradient }: { label: string; value: string | number; icon: string; gradient: string }) {
  return (
    <div
      className="rounded-xl p-4 text-center relative overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #ffffff, #f8f6f0)",
        border: "1px solid var(--c-border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-base mx-auto mb-2"
        style={{ background: gradient }}
      >
        {icon}
      </div>
      <p className="text-xl font-semibold text-charcoal" style={{ fontFamily: "var(--font-fraunces)" }}>
        {value}
      </p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
    </div>
  );
}

/* ── Section wrapper ───────────────────────────── */
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden mt-6"
      style={{
        background: "linear-gradient(145deg, #ffffff, #f8f6f0)",
        border: "1px solid var(--c-border)",
        boxShadow: "var(--shadow-card-md)",
      }}
    >
      <div className="px-6 sm:px-8 py-4 border-b border-border flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <h2 className="text-base font-semibold text-charcoal">{title}</h2>
      </div>
      <div className="p-6 sm:p-8">{children}</div>
    </div>
  );
}

/* ── Appearance toggle ─────────────────────────── */
function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <Section title="Appearance" icon="🎨">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm font-medium text-charcoal">Theme</p>
          <p className="text-xs text-muted mt-0.5">Choose between light and dark mode</p>
        </div>
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            isDark ? "bg-accent" : "bg-border-strong"
          }`}
          aria-label="Toggle theme"
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
              isDark ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
      <div className="flex gap-3">
        {(["light", "dark"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTheme(t)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
              theme === t
                ? "border-accent bg-accent-light text-accent"
                : "border-border text-muted hover:border-border-strong hover:text-charcoal"
            }`}
          >
            {t === "light" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
            {t === "light" ? "Light" : "Dark"}
          </button>
        ))}
      </div>
    </Section>
  );
}

/* ── Badges section ────────────────────────────── */
function BadgesSection({ stats }: { stats: UserStats | null }) {
  const avgScore =
    stats && stats.total_sessions > 0
      ? Math.round(stats.cumulative_score / stats.total_sessions)
      : 0;

  const rank = getRank(avgScore);
  const progress = getProgressToNextRank(avgScore);
  const nextRank = rank.nextMinScore !== null
    ? RANKS.find((r) => r.minScore === rank.nextMinScore)
    : null;

  return (
    <Section title="Rank & Achievements" icon="🏆">
      {!stats || stats.total_sessions === 0 ? (
        <div className="text-center py-8">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4"
            style={{
              background: "linear-gradient(135deg, #fef8ec, #f8f6f0)",
              border: "1px solid var(--c-accent-mid)",
              boxShadow: "0 4px 20px rgba(232,185,35,0.15)",
            }}
          >
            🔰
          </div>
          <p className="text-sm text-muted">Complete your first session to earn a rank</p>
        </div>
      ) : (
        <>
          {/* Rank badge */}
          <div
            className="flex items-center gap-5 mb-6 p-4 rounded-xl"
            style={{ background: rank.color + "10", border: `1px solid ${rank.color}30` }}
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-card-md border-2 shrink-0"
              style={{ borderColor: rank.color, backgroundColor: rank.color + "18" }}
            >
              {rank.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-2xs text-muted tracking-widest uppercase mb-1">Current Rank</p>
              <p className="text-2xl font-semibold" style={{ color: rank.color, fontFamily: "var(--font-fraunces)" }}>
                {rank.title}
              </p>
              <p className="text-sm text-muted mt-0.5">
                Avg score: <span className="text-charcoal font-medium">{avgScore}/100</span>
              </p>
            </div>
          </div>

          {/* Progress to next rank */}
          {nextRank && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted">Progress to {nextRank.emoji} {nextRank.title}</span>
                <span className="text-xs font-mono text-muted">{progress}%</span>
              </div>
              <div className="h-2.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${rank.color}, #00b4d8)` }}
                />
              </div>
              <p className="text-xs text-muted mt-1.5">
                Need avg ≥ {nextRank.minScore} — you&apos;re at {avgScore}
              </p>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="Sessions" value={stats.total_sessions} icon="📋" gradient="linear-gradient(135deg, #fef8ec, #fde68a)" />
            <StatCard label="Questions" value={stats.total_questions} icon="❓" gradient="linear-gradient(135deg, #e0f2fe, #bae6fd)" />
            <StatCard label="Best Score" value={`${stats.best_score}/100`} icon="🏅" gradient="linear-gradient(135deg, #dcfce7, #bbf7d0)" />
            <StatCard label="Day Streak" value={`${stats.current_streak}🔥`} icon="⚡" gradient="linear-gradient(135deg, #fee2e2, #fecaca)" />
          </div>

          {/* All ranks */}
          <div>
            <p className="font-mono text-2xs text-muted tracking-widest uppercase mb-3">All Ranks</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {RANKS.map((r) => (
                <div
                  key={r.title}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-colors ${
                    r.title === rank.title ? "border-current" : "border-border opacity-50"
                  }`}
                  style={r.title === rank.title ? { borderColor: r.color, backgroundColor: r.color + "12" } : {}}
                >
                  <span className="text-base">{r.emoji}</span>
                  <div>
                    <p className="font-medium text-charcoal text-[11px]">{r.title}</p>
                    <p className="text-muted text-[10px]">≥{r.minScore}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Section>
  );
}

/* ── Page ──────────────────────────────────────── */
export default function SettingsPage(): React.ReactElement {
  const router = useRouter();
  const clientRef = useRef<ReturnType<typeof createClient> | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  function getClient() {
    if (!clientRef.current) {
      const c = createClient();
      if (c) clientRef.current = c;
    }
    return clientRef.current;
  }

  useEffect(() => {
    getClient()?.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (data.user) loadUserStats().then(setStats);
    });
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    await getClient()?.auth.signOut();
    router.push("/login");
  }

  const provider = user ? getProvider(user) : null;
  const name = user?.user_metadata?.full_name as string | undefined;
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const email = user?.email ?? "";
  const initials = user ? getInitials(name, email) : "";

  return (
    <>
      <Header />
      {/* Gradient accent bar */}
      <div className="h-1" style={{ background: "linear-gradient(90deg, #e8b923, #00b4d8)" }} />
      <main className="max-w-2xl mx-auto px-5 sm:px-8 py-12">
        <div className="mb-8">
          <p className="label mb-2">Account</p>
          <h1 className="text-3xl font-semibold text-charcoal" style={{ fontFamily: "var(--font-fraunces)" }}>
            Settings
          </h1>
        </div>

        {/* ── Profile card ──────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #ffffff, #f8f6f0)",
            border: "1px solid var(--c-border)",
            boxShadow: "var(--shadow-card-md)",
          }}
        >
          {/* Card header accent */}
          <div className="h-1" style={{ background: "linear-gradient(90deg, #e8b923, #00b4d8)" }} />

          <div className="p-6 sm:p-8">
            {!user ? (
              <div className="flex gap-3 animate-pulse">
                <div className="w-16 h-16 rounded-full bg-border shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-border rounded w-1/3" />
                  <div className="h-3 bg-border rounded w-1/2" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name ?? email}
                    className="w-16 h-16 rounded-full object-cover shadow-card shrink-0"
                    style={{ border: "3px solid var(--c-border)" }}
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #fef8ec, #e8b923)",
                      border: "3px solid rgba(232,185,35,0.3)",
                    }}
                  >
                    <span className="text-xl font-semibold text-white" style={{ fontFamily: "var(--font-mono)" }}>
                      {initials}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {name && <p className="text-lg font-semibold text-charcoal truncate">{name}</p>}
                  <p className="text-sm text-body truncate">{email}</p>
                  {provider && (
                    <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-medium font-mono bg-border/40 text-body border border-border">
                      {PROVIDER_ICONS[provider]}
                      Signed in with {PROVIDER_LABELS[provider]}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-border mt-7 pt-7">
              <button
                onClick={handleSignOut}
                disabled={signingOut || !user}
                className="btn-secondary text-danger border-danger/20 hover:bg-danger-light hover:border-danger/30 flex items-center gap-2 disabled:opacity-50"
              >
                {signingOut ? (
                  <>
                    <span className="w-4 h-4 border-2 border-danger/30 border-t-danger rounded-full animate-spin" />
                    Signing out…
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign out
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Badges ────────────────────────── */}
        <BadgesSection stats={stats} />

        {/* ── Appearance ────────────────────── */}
        <AppearanceSection />
      </main>
    </>
  );
}
