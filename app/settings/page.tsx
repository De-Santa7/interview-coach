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

const PROVIDER_COLORS: Record<Provider, string> = {
  google: "bg-info-light text-info",
  apple: "bg-border text-charcoal",
  email: "bg-accent-light text-accent",
};

/* ── Stat card ─────────────────────────────────── */
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card rounded-lg p-4 text-center">
      <p className="text-xl font-semibold text-charcoal" style={{ fontFamily: "var(--font-fraunces)" }}>
        {value}
      </p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
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
    <div className="card-md p-6 sm:p-8 mt-6">
      <h2 className="text-base font-semibold text-charcoal mb-4">Appearance</h2>
      <div className="flex items-center justify-between">
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
      <div className="flex gap-3 mt-4">
        {(["light", "dark"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTheme(t)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border text-sm font-medium transition-all ${
              theme === t
                ? "border-accent bg-accent-light text-accent"
                : "border-border text-muted hover:border-border-strong hover:text-charcoal"
            }`}
          >
            {t === "light" ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
            {t === "light" ? "Light" : "Dark"}
          </button>
        ))}
      </div>
    </div>
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
    <div className="card-md p-6 sm:p-8 mt-6">
      <h2 className="text-base font-semibold text-charcoal mb-6">Rank & Achievements</h2>

      {!stats || stats.total_sessions === 0 ? (
        <div className="text-center py-6">
          <span className="text-5xl">🔰</span>
          <p className="text-sm text-muted mt-3">Complete your first session to earn a rank</p>
        </div>
      ) : (
        <>
          {/* Rank badge */}
          <div className="flex items-center gap-5 mb-6">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-card-md border-2 shrink-0"
              style={{ borderColor: rank.color, backgroundColor: rank.color + "18" }}
            >
              {rank.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-2xs text-muted tracking-widest uppercase mb-1">Current Rank</p>
              <p
                className="text-2xl font-semibold"
                style={{ color: rank.color, fontFamily: "var(--font-fraunces)" }}
              >
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
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progress}%`, backgroundColor: rank.color }}
                />
              </div>
              <p className="text-xs text-muted mt-1.5">
                Need avg ≥ {nextRank.minScore} — you&apos;re at {avgScore}
              </p>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="Sessions" value={stats.total_sessions} />
            <StatCard label="Questions" value={stats.total_questions} />
            <StatCard label="Best Score" value={`${stats.best_score}/100`} />
            <StatCard label="Day Streak" value={`${stats.current_streak}🔥`} />
          </div>

          {/* All ranks reference */}
          <div>
            <p className="font-mono text-2xs text-muted tracking-widest uppercase mb-3">All Ranks</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {RANKS.map((r) => (
                <div
                  key={r.title}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-colors ${
                    r.title === rank.title
                      ? "border-current"
                      : "border-border opacity-50"
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
    </div>
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
      <main className="max-w-2xl mx-auto px-5 sm:px-8 py-12">
        <div className="mb-8">
          <p className="label mb-1">Account</p>
          <h1
            className="text-3xl font-semibold text-charcoal"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Settings
          </h1>
        </div>

        {/* ── Profile card ──────────────────── */}
        <div className="card-md p-6 sm:p-8">
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
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-accent-light border border-accent-mid flex items-center justify-center shrink-0">
                  <span
                    className="text-xl font-semibold text-accent"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {initials}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                {name && (
                  <p className="text-lg font-semibold text-charcoal truncate">{name}</p>
                )}
                <p className="text-sm text-body truncate">{email}</p>
                {provider && (
                  <span
                    className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-medium font-mono ${PROVIDER_COLORS[provider]}`}
                  >
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

        {/* ── Badges ────────────────────────── */}
        <BadgesSection stats={stats} />

        {/* ── Appearance ────────────────────── */}
        <AppearanceSection />
      </main>
    </>
  );
}
