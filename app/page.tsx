"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PageWrapper from "@/components/PageWrapper";
import Header from "@/components/Header";
import { PROFESSION_CATEGORIES, filterProfessions } from "@/lib/professions";

/* ── Ease ─────────────────────────────────────────── */
const ease = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.65, delay: d, ease } }),
};

/* ── Hero search bar ─────────────────────────────── */
function HeroSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSuggestions(filterProfessions(value));
  }, [value]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        !dropRef.current?.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      )
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function go(role: string) {
    if (!role.trim()) return;
    router.push(`/setup?role=${encodeURIComponent(role.trim())}`);
  }

  function pick(role: string) {
    setValue(role);
    setOpen(false);
    go(role);
  }

  return (
    <div className="relative w-full">
      <div className="flex rounded-xl overflow-visible bg-white shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
        <div className="flex items-center pl-5 pr-3 shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9c9a94" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && go(value)}
          placeholder="What role are you interviewing for?"
          className="flex-1 py-4 pr-2 text-charcoal text-base placeholder:text-muted bg-transparent outline-none min-w-0"
        />
        <button
          type="button"
          onClick={() => go(value)}
          className="shrink-0 m-1.5 px-3 sm:px-6 py-3 rounded-lg bg-accent hover:bg-accent-hover transition-colors text-white font-semibold text-sm whitespace-nowrap"
        >
          <span className="sm:hidden">→</span>
          <span className="hidden sm:inline">Start Practice →</span>
        </button>
      </div>

      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div
            ref={dropRef}
            className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white border border-border rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] overflow-hidden"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className="w-full text-left px-5 py-3 text-sm text-charcoal hover:bg-accent-light hover:text-accent transition-colors flex items-center gap-2.5"
                onClick={() => pick(s)}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-muted/40 flex-shrink-0"/>
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Role chip ────────────────────────────────────── */
function HeroChip({ role }: { role: string }) {
  return (
    <Link
      href={`/setup?role=${encodeURIComponent(role)}`}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/12 hover:bg-white/22 border border-white/20 hover:border-white/45 text-white/80 hover:text-white text-xs font-medium transition-all duration-150 whitespace-nowrap backdrop-blur-sm"
    >
      {role}
    </Link>
  );
}

/* ── How-it-works steps ──────────────────────────── */
const STEPS = [
  {
    n: "01",
    title: "Configure your session",
    desc: "Choose your role, experience level, interview type, and question count.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M19.07 4.93A10 10 0 0 1 4.93 19.07"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>,
  },
  {
    n: "02",
    title: "Answer interview questions",
    desc: "Type or speak your answers to realistic, role-calibrated questions.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  },
  {
    n: "03",
    title: "Receive your hiring verdict",
    desc: "Complete a role-specific challenge and get an honest AI hiring report.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  },
];

/* ── Page ────────────────────────────────────────── */
export default function Home() {
  return (
    <PageWrapper>
      {/* ═══════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">

        {/* ── Background: real image as watermark ── */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-bg.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
          style={{ opacity: 0.22 }}
        />

        {/* Dark overlay for text readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(160deg, rgba(10,9,7,0.88) 0%, rgba(14,12,9,0.72) 50%, rgba(10,9,7,0.90) 100%)",
          }}
        />

        {/* Warm gold glow — top-left & bottom-right accent */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 55% 50% at 8% 12%, rgba(196,154,42,0.13) 0%, transparent 60%), radial-gradient(ellipse 45% 40% at 92% 88%, rgba(196,154,42,0.08) 0%, transparent 60%)",
          }}
        />

        {/* Header */}
        <div className="relative z-50">
          <Header dark />
        </div>

        {/* ── Hero content — two-column spread ── */}
        <div className="relative z-10 flex-1 flex items-center">
          <div className="w-full max-w-6xl mx-auto px-6 sm:px-10 py-10 sm:py-20 lg:py-28">

            <div className="grid lg:grid-cols-[1fr_420px] gap-16 xl:gap-24 items-center">

              {/* LEFT: headline + subtext + CTA */}
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
              >
                {/* Tag */}
                <motion.div variants={fadeUp} custom={0}>
                  <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/75 font-mono text-[10px] tracking-wider sm:tracking-widest uppercase px-3 sm:px-4 py-1.5 rounded-full mb-5 sm:mb-8">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse inline-block" />
                    AI-Powered Interview Practice
                  </div>
                </motion.div>

                {/* Headline */}
                <motion.h1
                  variants={fadeUp}
                  custom={0.06}
                  className="text-[clamp(1.5rem,8.5vw,4.5rem)] lg:text-[5.2rem] xl:text-[6rem] font-light text-white leading-[1.05] tracking-tight mb-5 sm:mb-7"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  Ace every
                  <br />
                  interview.
                  <br />
                  <em className="not-italic" style={{ color: "#c49a2a" }}>
                    Practice smarter.
                  </em>
                </motion.h1>

                {/* Sub */}
                <motion.p
                  variants={fadeUp}
                  custom={0.12}
                  className="text-white/60 text-base sm:text-lg leading-relaxed max-w-[500px] mb-6 sm:mb-10"
                >
                  Role-specific questions, voice answers, real challenges — and an honest AI hiring verdict. Built for every profession.
                </motion.p>

                {/* Search */}
                <motion.div variants={fadeUp} custom={0.18} className="mb-6 sm:mb-10 max-w-[560px]">
                  <HeroSearch />
                </motion.div>

                {/* Stats row */}
                <motion.div
                  variants={fadeUp}
                  custom={0.24}
                  className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 pt-5 sm:pt-6 border-t border-white/10"
                >
                  <div className="flex items-center gap-5 sm:gap-8">
                    {[
                      { n: "80+", label: "Roles" },
                      { n: "10", label: "Fields" },
                      { n: "Free", label: "Always" },
                    ].map(({ n, label }) => (
                      <div key={label} className="text-center">
                        <div
                          className="text-xl sm:text-2xl font-light text-accent"
                          style={{ fontFamily: "var(--font-fraunces)" }}
                        >
                          {n}
                        </div>
                        <div className="text-xs text-white/40 font-mono tracking-wide uppercase mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>
                  <Link href="/setup" className="btn-primary !text-sm !px-6 !py-2.5">
                    Begin →
                  </Link>
                </motion.div>
              </motion.div>

              {/* RIGHT: role chips by category */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.3, ease }}
                className="hidden lg:block"
              >
                <div
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 space-y-5"
                  style={{ boxShadow: "0 8px 48px rgba(0,0,0,0.4)" }}
                >
                  <p className="font-mono text-[10px] text-white/35 tracking-widest uppercase mb-1">Browse by field</p>
                  {PROFESSION_CATEGORIES.map((cat) => (
                    <div key={cat.label}>
                      <p className="font-mono text-[9px] text-white/30 tracking-widest uppercase mb-2">{cat.label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.professions.slice(0, 5).map((role) => (
                          <HeroChip key={role} role={role} />
                        ))}
                        {cat.professions.length > 5 && (
                          <span className="inline-flex items-center px-2.5 py-1.5 text-[10px] text-white/25 font-mono">
                            +{cat.professions.length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Mobile chips (below fold on small screens) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease }}
              className="lg:hidden mt-8 sm:mt-12 space-y-3"
            >
              {PROFESSION_CATEGORIES.slice(0, 4).map((cat) => (
                <div key={cat.label} className="flex items-start gap-3">
                  <span className="font-mono text-[9px] text-white/30 tracking-widest uppercase pt-2 w-[70px] shrink-0">
                    {cat.label}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.professions.slice(0, 4).map((role) => (
                      <HeroChip key={role} role={role} />
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          BELOW FOLD — light background
      ═══════════════════════════════════════════ */}

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 sm:px-10 py-16 sm:py-28">
        <motion.div
          className="mb-8 sm:mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="label mb-3">How it works</p>
          <h2
            className="text-2xl sm:text-4xl font-light text-charcoal"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Three steps to interview-ready
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-6">
          {STEPS.map(({ n, title, desc, icon }, i) => (
            <motion.div
              key={n}
              className="card p-5 sm:p-7 group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.13, ease }}
              whileHover={{ y: -3, transition: { duration: 0.18 } }}
            >
              <div className="flex items-start justify-between mb-6">
                <span
                  className="text-4xl font-light text-accent/30 group-hover:text-accent/55 transition-colors"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  {n}
                </span>
                <span className="text-accent/70 group-hover:text-accent transition-colors">{icon}</span>
              </div>
              <h3 className="text-base font-semibold text-charcoal mb-2">{title}</h3>
              <p className="text-sm text-body leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 sm:px-10 pb-16 sm:pb-28">
        <motion.div
          className="card-md rounded-xl p-6 sm:p-10 lg:p-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-8 bg-gradient-to-br from-white to-accent-light/40"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease }}
        >
          <div>
            <h2
              className="text-3xl font-light text-charcoal mb-2"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Ready to get started?
            </h2>
            <p className="text-body text-sm">Takes 20–30 minutes for a full session.</p>
          </div>
          <Link href="/setup" className="btn-primary !text-base !px-10 !py-3.5 shrink-0 w-full sm:w-auto text-center">
            Begin Session →
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-accent inline-flex items-center justify-center text-white text-2xs font-bold">
              IC
            </span>
            <span
              className="text-sm font-medium text-charcoal"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              InterviewCoach
            </span>
          </span>
          <p className="text-xs text-muted">Practice interviews that actually prepare you.</p>
        </div>
      </footer>
    </PageWrapper>
  );
}
