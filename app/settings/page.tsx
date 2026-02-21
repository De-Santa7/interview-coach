"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";

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

export default function SettingsPage(): React.ReactElement {
  const router = useRouter();
  const clientRef = useRef<ReturnType<typeof createClient> | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  function getClient() {
    if (!clientRef.current) {
      const c = createClient();
      if (c) clientRef.current = c;
    }
    return clientRef.current;
  }

  useEffect(() => {
    getClient()?.auth.getUser().then(({ data }) => setUser(data.user ?? null));
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
              {/* Avatar */}
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

              {/* Info */}
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
      </main>
    </>
  );
}
