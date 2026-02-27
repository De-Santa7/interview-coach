"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PageWrapper from "@/components/PageWrapper";
import Header from "@/components/Header";
import LogoIcon from "@/components/LogoIcon";
import { PROFESSION_CATEGORIES, filterProfessions } from "@/lib/professions";

const ease = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.65, delay: d, ease } }),
};

/* ── Animated cycling profession text ────────────── */
const CYCLING_ROLES = [
  "Frontend Developers",
  "Registered Nurses",
  "Lawyers",
  "Product Managers",
  "Data Scientists",
  "Financial Analysts",
  "UX Designers",
  "Marketing Managers",
  "Mechanical Engineers",
  "Teachers",
];

function CyclingText() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % CYCLING_ROLES.length);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="inline-block" style={{ color: "#e8b923" }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          className="inline-block"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35 }}
        >
          {CYCLING_ROLES[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ── Animated stat counter ───────────────────────── */
function StatCounter({ target, label, suffix = "" }: { target: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = target / 40;
        const id = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(id); }
          else setCount(Math.floor(start));
        }, 30);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="text-center">
      <div
        className="text-3xl sm:text-4xl font-light"
        style={{ fontFamily: "var(--font-fraunces)", color: "#e8b923" }}
      >
        {count}{suffix}
      </div>
      <div className="text-xs text-white/40 font-mono tracking-wide uppercase mt-1">{label}</div>
    </div>
  );
}

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
          className="shrink-0 m-1.5 px-3 sm:px-6 py-3 rounded-lg transition-colors text-white font-semibold text-sm whitespace-nowrap"
          style={{ background: "linear-gradient(135deg, #e8b923, #c49a2a)", boxShadow: "0 2px 12px rgba(232,185,35,0.4)" }}
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
                className="w-full text-left px-5 py-3 text-sm text-charcoal hover:bg-accent-light hover:text-accent-hover transition-colors flex items-center gap-2.5"
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
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/22 border border-white/20 hover:border-white/45 text-white/80 hover:text-white text-xs font-medium transition-all duration-150 whitespace-nowrap backdrop-blur-sm"
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
    icon: "⚙️",
    color: "#e8b923",
  },
  {
    n: "02",
    title: "Answer interview questions",
    desc: "Type or speak your answers to realistic, role-calibrated questions.",
    icon: "💬",
    color: "#00b4d8",
  },
  {
    n: "03",
    title: "Receive your hiring verdict",
    desc: "Complete a role-specific challenge and get an honest AI hiring report.",
    icon: "📋",
    color: "#06d6a0",
  },
];

/* ── Testimonials ────────────────────────────────── */
const TESTIMONIALS = [
  {
    name: "Sarah K.",
    role: "Frontend Developer",
    company: "Hired at a Series B startup",
    text: "I went in completely cold for my React interview and bombed it. After two weeks of using InterviewCoach daily, I landed an offer at my dream company. The AI feedback was brutally honest — exactly what I needed.",
    rating: 5,
    avatar: "SK",
    color: "#e8b923",
  },
  {
    name: "James M.",
    role: "Registered Nurse",
    company: "Accepted into ICU residency",
    text: "I didn't expect an AI tool to understand clinical scenarios, but the questions were genuinely realistic. It helped me structure my STAR answers for behavioral rounds and I felt way more confident walking in.",
    rating: 5,
    avatar: "JM",
    color: "#00b4d8",
  },
  {
    name: "Priya L.",
    role: "Product Manager",
    company: "Joined a Fortune 500 company",
    text: "The practical challenge feature is what sets this apart. I got a real PRD writing task that was almost identical to what I faced in my actual interview. The AI verdict gave me a clear picture of where I stood.",
    rating: 5,
    avatar: "PL",
    color: "#06d6a0",
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

        {/* Background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-bg.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
          style={{ opacity: 0.2 }}
        />

        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
            opacity: 0.92,
          }}
        />

        {/* Gold glow accents */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 55% 50% at 8% 12%, rgba(232,185,35,0.15) 0%, transparent 60%), radial-gradient(ellipse 45% 40% at 92% 88%, rgba(0,180,216,0.1) 0%, transparent 60%)",
          }}
        />

        {/* Floating blobs */}
        <div className="blob blob-gold w-64 h-64" style={{ top: "15%", left: "5%" }} />
        <div className="blob blob-teal w-80 h-80" style={{ top: "60%", right: "5%" }} />

        {/* Header */}
        <div className="relative z-50">
          <Header dark />
        </div>

        {/* Hero content */}
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
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: "#e8b923" }} />
                    AI-Powered Interview Practice
                  </div>
                </motion.div>

                {/* Headline with animated text */}
                <motion.h1
                  variants={fadeUp}
                  custom={0.06}
                  className="text-[clamp(1.5rem,8.5vw,4.5rem)] lg:text-[5.2rem] xl:text-[6rem] font-light text-white leading-[1.05] tracking-tight mb-5 sm:mb-7"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  Preparing
                  <br />
                  <CyclingText />
                  <br />
                  <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.65em" }}>
                    for what&apos;s next.
                  </span>
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
                  <div className="flex items-center gap-8 sm:gap-12">
                    <StatCounter target={80} label="Roles" suffix="+" />
                    <StatCounter target={10} label="Fields" />
                    <div className="text-center">
                      <div className="text-3xl sm:text-4xl font-light" style={{ fontFamily: "var(--font-fraunces)", color: "#e8b923" }}>
                        Free
                      </div>
                      <div className="text-xs text-white/40 font-mono tracking-wide uppercase mt-1">Always</div>
                    </div>
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

            {/* Mobile chips */}
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
          HOW IT WORKS
      ═══════════════════════════════════════════ */}
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
          {STEPS.map(({ n, title, desc, icon, color }, i) => (
            <motion.div
              key={n}
              className="relative p-7 group"
              style={{
                background: "linear-gradient(145deg, #ffffff, #f8f6f0)",
                border: "1px solid var(--c-border)",
                borderRadius: "18px",
                boxShadow: "var(--shadow-card)",
                transition: "all 0.2s ease",
              }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.13, ease }}
              whileHover={{ y: -6, boxShadow: "var(--shadow-card-hover)" }}
            >
              {/* Connecting line */}
              {i < STEPS.length - 1 && (
                <div
                  className="absolute top-10 -right-3 w-6 h-0.5 hidden sm:block"
                  style={{ background: `linear-gradient(90deg, ${color}, ${STEPS[i+1].color})` }}
                />
              )}
              <div className="flex items-start justify-between mb-6">
                <span
                  className="text-5xl font-light opacity-15 group-hover:opacity-30 transition-opacity"
                  style={{ fontFamily: "var(--font-fraunces)", color }}
                >
                  {n}
                </span>
                <span className="text-3xl">{icon}</span>
              </div>
              <h3 className="text-base font-semibold text-charcoal mb-2">{title}</h3>
              <p className="text-sm text-body leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 sm:px-10 pb-16 sm:pb-20">
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="label mb-3">Success stories</p>
          <h2
            className="text-2xl sm:text-4xl font-light text-charcoal"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            People who landed the role
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ name, role, company, text, rating, avatar, color }, i) => (
            <motion.div
              key={name}
              className="p-6 flex flex-col gap-4"
              style={{
                background: "linear-gradient(145deg, #ffffff, #f8f6f0)",
                border: "1px solid var(--c-border)",
                borderRadius: "18px",
                boxShadow: "var(--shadow-card)",
                transition: "all 0.2s ease",
              }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease }}
              whileHover={{ y: -4, boxShadow: "var(--shadow-card-hover)" }}
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: rating }).map((_, j) => (
                  <span key={j} style={{ color: "#e8b923" }}>★</span>
                ))}
              </div>
              <p className="text-sm text-charcoal leading-relaxed flex-1 italic">
                &ldquo;{text}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-3 border-t border-border">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: color }}
                >
                  {avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-charcoal">{name}</p>
                  <p className="text-xs text-muted">{role} · {company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA
      ═══════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 sm:px-10 pb-16 sm:pb-28">
        <motion.div
          className="relative overflow-hidden rounded-2xl p-8 sm:p-12 lg:p-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8"
          style={{
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          }}
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease }}
        >
          {/* Background glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 60% 60% at 20% 50%, rgba(232,185,35,0.12) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 80% 50%, rgba(0,180,216,0.1) 0%, transparent 70%)",
            }}
          />
          <div>
            <h2
              className="text-3xl sm:text-4xl font-light text-white mb-3 relative z-10"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Ready to get hired?
            </h2>
            <p className="text-white/60 text-sm relative z-10">Takes 20–30 minutes for a full session. 80+ roles supported.</p>
          </div>
          <Link
            href="/setup"
            className="relative z-10 shrink-0 w-full sm:w-auto text-center font-semibold text-base px-10 py-4 rounded-xl text-white transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #e8b923, #c49a2a)",
              boxShadow: "0 4px 20px rgba(232,185,35,0.4)",
            }}
          >
            Begin Session →
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)" }}>
        {/* Gold accent top border */}
        <div style={{ height: "1px", background: "linear-gradient(90deg, #e8b923, #00b4d8, #e8b923)" }} />
        <div className="max-w-6xl mx-auto px-6 sm:px-10 pt-14 pb-10">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-10 mb-10">
            <div className="flex flex-col gap-3 max-w-xs">
              <Link href="/" className="flex items-center gap-2.5 group w-fit">
                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shrink-0 group-hover:opacity-90 transition-opacity shadow-sm">
                  <LogoIcon size={24} />
                </div>
                <span className="text-lg font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
                  <span style={{ color: "#ffffff" }}>Interview</span>
                  <span style={{ color: "#e8b923" }}>Coach</span>
                </span>
              </Link>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                AI-powered practice interviews with real-world challenges and detailed hiring reports.
              </p>
            </div>

            <div className="flex gap-12 sm:gap-16">
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "#e8b923", fontFamily: "var(--font-mono)" }}>
                  Product
                </p>
                <ul className="flex flex-col gap-2.5">
                  {[
                    { href: "/", label: "Home" },
                    { href: "/setup", label: "New Session" },
                    { href: "/history", label: "History" },
                  ].map(({ href, label }) => (
                    <li key={href}>
                      <Link href={href} className="text-sm transition-colors duration-150" style={{ color: "rgba(255,255,255,0.45)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "#e8b923", fontFamily: "var(--font-mono)" }}>
                  Account
                </p>
                <ul className="flex flex-col gap-2.5">
                  {[
                    { href: "/login", label: "Sign In" },
                    { href: "/signup", label: "Create Account" },
                    { href: "/settings", label: "Settings" },
                  ].map(({ href, label }) => (
                    <li key={href}>
                      <Link href={href} className="text-sm transition-colors duration-150" style={{ color: "rgba(255,255,255,0.45)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.08)" }} className="mb-6" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              © {new Date().getFullYear()} InterviewCoach. All rights reserved.
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              Practice interviews that actually prepare you.
            </p>
          </div>
        </div>
      </footer>
    </PageWrapper>
  );
}
