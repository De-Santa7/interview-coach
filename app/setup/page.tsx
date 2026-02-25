"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

declare global { interface Window { gtag?: (...args: unknown[]) => void; } }
import { motion } from "framer-motion";
import PageWrapper from "@/components/PageWrapper";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import { useSession } from "@/lib/session-context";
import { filterProfessions } from "@/lib/professions";
import {
  ExperienceLevel,
  InterviewType,
  QuestionCount,
  SessionConfig,
} from "@/lib/types";

/* ── Small icon helpers ──────────────────────────── */
function SearchIcon() {
  return (
    <svg className="w-4 h-4 text-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}

const LEVEL_ICONS: Record<ExperienceLevel, string> = {
  Junior: "🌱",
  "Mid-Level": "⚡",
  Senior: "🔥",
  Lead: "🚀",
};
const LEVEL_DESC: Record<ExperienceLevel, string> = {
  Junior: "0–2 years",
  "Mid-Level": "3–5 years",
  Senior: "6–10 years",
  Lead: "10+ years",
};

const TYPE_ICONS: Record<InterviewType, React.ReactElement> = {
  Technical: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  Behavioral: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Mixed: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>
    </svg>
  ),
};

const TYPE_DESC: Record<InterviewType, string> = {
  Technical: "Skills, architecture & problem-solving",
  Behavioral: "Soft skills, past experience & culture",
  Mixed: "Balanced blend of both",
};

/* ── Main form ───────────────────────────────────── */
function SetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setConfig, setQuestions, setChallenge, reset } = useSession();

  const [profession, setProfession] = useState(searchParams.get("role") || "");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [level, setLevel] = useState<ExperienceLevel>("Mid-Level");
  const [interviewType, setInterviewType] = useState<InterviewType>("Mixed");
  const [questionCount, setQuestionCount] = useState<QuestionCount>(5);
  const [includeChallenge, setIncludeChallenge] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSuggestions(profession.length > 0 ? filterProfessions(profession) : filterProfessions(""));
  }, [profession]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node) && !inputRef.current?.contains(e.target as Node))
        setShowSuggestions(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profession.trim()) { setError("Please enter a profession or role."); return; }
    setError(""); setLoading(true);
    try {
      reset();
      const config: SessionConfig = { profession: profession.trim(), level, interviewType, questionCount, includeChallenge };
      setConfig(config);
      window.gtag?.("event", "session_started", { profession: config.profession, level, interviewType, questionCount });
      const reqs: Promise<Response>[] = [
        fetch("/api/generate-questions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profession, level, interviewType, questionCount }) }),
      ];
      if (includeChallenge) reqs.push(
        fetch("/api/generate-challenge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profession, level }) })
      );
      const [qRes, cRes] = await Promise.all(reqs);
      if (!qRes.ok) throw new Error("Questions failed");
      setQuestions((await qRes.json()).questions);
      if (cRes) { if (!cRes.ok) throw new Error("Challenge failed"); setChallenge((await cRes.json()).challenge); }
      router.push("/interview");
    } catch {
      setError("Something went wrong. Check your API key and try again.");
    } finally { setLoading(false); }
  }

  const levels: ExperienceLevel[] = ["Junior", "Mid-Level", "Senior", "Lead"];
  const types: InterviewType[] = ["Technical", "Behavioral", "Mixed"];
  const counts: QuestionCount[] = [3, 5, 10];

  const card = (i: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Role search ─────────────────────────── */}
      <motion.div className="card p-6" {...card(0)}>
        <label className="label block mb-3">Role / Profession</label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <SearchIcon />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={profession}
            onChange={(e) => { setProfession(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search roles — e.g. Frontend Developer..."
            className="input-field !pl-10"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-30 top-full left-0 right-0 mt-1 bg-surface border border-border rounded-md shadow-card-md overflow-hidden"
            >
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-sm text-charcoal hover:bg-accent-light hover:text-accent transition-colors flex items-center gap-2"
                  onClick={() => { setProfession(s); setShowSuggestions(false); }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-muted/40 flex-shrink-0" />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Experience level ─────────────────────── */}
      <motion.div className="card p-6" {...card(1)}>
        <label className="label block mb-4">Experience Level</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {levels.map((l) => {
            const active = level === l;
            return (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className={`flex flex-col items-center gap-1.5 px-3 py-4 rounded-md border transition-all duration-150 ${
                  active
                    ? "border-accent bg-accent-light shadow-card-accent"
                    : "border-border bg-surface hover:border-border-strong hover:bg-bg"
                }`}
              >
                <span className="text-2xl">{LEVEL_ICONS[l]}</span>
                <span className={`text-sm font-semibold ${active ? "text-accent" : "text-charcoal"}`}>{l}</span>
                <span className="text-xs text-muted">{LEVEL_DESC[l]}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Interview type ───────────────────────── */}
      <motion.div className="card p-6" {...card(2)}>
        <label className="label block mb-4">Interview Type</label>
        <div className="grid sm:grid-cols-3 gap-3">
          {types.map((t) => {
            const active = interviewType === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setInterviewType(t)}
                className={`flex flex-col items-start gap-2 px-4 py-4 rounded-md border transition-all duration-150 text-left ${
                  active
                    ? "border-accent bg-accent-light shadow-card-accent"
                    : "border-border bg-surface hover:border-border-strong hover:bg-bg"
                }`}
              >
                <span className={active ? "text-accent" : "text-muted"}>
                  {TYPE_ICONS[t]}
                </span>
                <div>
                  <p className={`text-sm font-semibold ${active ? "text-accent" : "text-charcoal"}`}>{t}</p>
                  <p className="text-xs text-muted mt-0.5">{TYPE_DESC[t]}</p>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Question count ───────────────────────── */}
      <motion.div className="card p-6" {...card(3)}>
        <label className="label block mb-4">Number of Questions</label>
        <div className="flex gap-3">
          {counts.map((c) => {
            const active = questionCount === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setQuestionCount(c)}
                className={`flex-1 py-3.5 rounded-md border text-sm font-semibold transition-all duration-150 ${
                  active
                    ? "border-accent bg-accent-light text-accent shadow-card-accent"
                    : "border-border bg-surface text-charcoal hover:border-border-strong"
                }`}
              >
                {c}
                <span className="block font-normal text-xs text-muted mt-0.5">
                  {c === 3 ? "Quick" : c === 5 ? "Standard" : "Deep dive"}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Challenge toggle ─────────────────────── */}
      <motion.div {...card(4)}
        className={`card p-5 flex items-start gap-4 cursor-pointer transition-all duration-150 ${
          includeChallenge ? "border-accent bg-accent-light/50" : ""
        }`}
        onClick={() => setIncludeChallenge(!includeChallenge)}
      >
        {/* Toggle */}
        <div className="mt-0.5 shrink-0">
          <div
            className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${
              includeChallenge ? "bg-accent" : "bg-border"
            }`}
          >
            <span
              className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
              style={{ transform: includeChallenge ? "translateX(22px)" : "translateX(2px)" }}
            />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-charcoal mb-1">
            Include practical challenge
            {includeChallenge && (
              <span className="ml-2 font-mono text-2xs text-accent bg-accent-light border border-accent-mid px-2 py-0.5 rounded-full">
                Recommended
              </span>
            )}
          </p>
          <p className="text-sm text-body leading-relaxed">
            A real, role-specific task — write code, draft a strategy, or solve a problem. Evaluated as part of your hiring report.
          </p>
        </div>
      </motion.div>

      {error && (
        <div className="flex items-center gap-2.5 bg-danger-light border border-danger/30 text-danger rounded-md px-4 py-3 text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full !py-4 !text-base flex items-center justify-center gap-3"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating your session...
          </>
        ) : (
          <>
            Begin Session
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </>
        )}
      </button>
    </form>
  );
}

export default function SetupPage() {
  return (
    <PageWrapper>
      <Header />
      <main className="max-w-2xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <div className="mb-8">
          <BackButton href="/" label="Home" />
        </div>
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <p className="label mb-3">Session Setup</p>
          <h1
            className="text-4xl font-light text-charcoal mb-3"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Configure your interview
          </h1>
          <p className="text-body text-sm leading-relaxed">
            Tell us about the role you&apos;re preparing for and we&apos;ll tailor everything to match.
          </p>
        </motion.div>
        <Suspense fallback={null}>
          <SetupForm />
        </Suspense>
      </main>
    </PageWrapper>
  );
}
