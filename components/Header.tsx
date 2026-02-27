"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import LogoIcon from "@/components/LogoIcon";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/history", label: "History" },
  { href: "/analytics", label: "Analytics" },
  { href: "/setup", label: "New Session" },
];

interface HeaderProps {
  dark?: boolean;
}

export default function Header({ dark = false }: HeaderProps): React.ReactElement {
  const pathname = usePathname();

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-sm border-b transition-colors duration-200 ${
        dark
          ? "bg-white/5 border-white/10"
          : "bg-bg/90 border-border"
      }`}
    >
      <div className="max-w-5xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 group-hover:opacity-90 transition-opacity shadow-sm">
            <LogoIcon size={22} />
          </div>
          <span
            className={`text-base font-semibold hidden sm:block transition-colors ${
              dark ? "text-white group-hover:text-accent" : "text-charcoal group-hover:text-accent"
            }`}
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            <span style={{ color: dark ? "#ffffff" : "#18181a" }}>Interview</span>
            <span style={{ color: "#e8b923" }}>Coach</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 hidden sm:block ${
                  dark
                    ? active
                      ? "bg-white/15 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                    : active
                    ? "bg-accent-light text-accent-hover font-semibold"
                    : "text-body hover:text-charcoal hover:bg-border/60"
                }`}
              >
                {label}
              </Link>
            );
          })}

          <Link
            href="/setup"
            className="ml-2 btn-primary !py-1.5 !px-4 !text-xs hidden sm:inline-flex"
          >
            Start Interview
          </Link>

          <ThemeToggle dark={dark} />
          <UserMenu dark={dark} />
        </nav>
      </div>
    </header>
  );
}

function getInitials(name: string | undefined, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }
  return (email[0] ?? "?").toUpperCase();
}

function UserMenu({ dark }: { dark: boolean }): React.ReactElement {
  const router = useRouter();
  const clientRef = useRef<ReturnType<typeof createClient> | null>(null);
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  function getClient() {
    if (!clientRef.current) {
      const c = createClient();
      if (c) clientRef.current = c;
    }
    return clientRef.current;
  }

  useEffect(() => {
    const supabase = getClient();
    if (!supabase) { setUser(null); return; }
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    await getClient()?.auth.signOut();
    router.push("/login");
  }

  if (user === undefined) return <div className="w-8 h-8 rounded-full bg-border/60 animate-pulse ml-2" />;

  if (!user) {
    return (
      <Link
        href="/login"
        className={`ml-2 text-sm font-medium px-3 py-1.5 rounded-md transition-all duration-150 ${
          dark ? "text-white/70 hover:text-white hover:bg-white/10" : "text-body hover:text-charcoal hover:bg-border/60"
        }`}
      >
        Sign in
      </Link>
    );
  }

  const name = user.user_metadata?.full_name as string | undefined;
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const email = user.email ?? "";
  const initials = getInitials(name, email);

  return (
    <div className="relative ml-2" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
        aria-label="User menu"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name ?? email}
            className="w-8 h-8 rounded-full object-cover shadow-card"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-accent-light border border-accent-mid flex items-center justify-center">
            <span
              className="text-xs font-semibold text-accent"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {initials}
            </span>
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-52 card-md py-1 z-50 animate-fade-in">
          <div className="px-3 py-2.5 border-b border-border">
            {name && <p className="text-sm font-medium text-charcoal truncate">{name}</p>}
            <p className="text-xs text-muted truncate">{email}</p>
          </div>
          <Link
            href="/analytics"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-body hover:text-charcoal hover:bg-bg transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            Analytics
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-body hover:text-charcoal hover:bg-bg transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            Settings
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger hover:bg-danger-light transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
