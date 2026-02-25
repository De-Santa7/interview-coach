"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

declare global { interface Window { gtag?: (...args: unknown[]) => void; } }
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import PageWrapper from "@/components/PageWrapper";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import { useSession } from "@/lib/session-context";

const CodeEditor = dynamic(
  () => import("@uiw/react-textarea-code-editor").then((m) => m.default),
  { ssr: false }
);

const TIMER_SECS = 15 * 60;

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function ChallengePage() {
  const router = useRouter();
  const { state, hydrated, setChallengeSubmission } = useSession();
  const { config, challenge, challengeSubmission } = state;

  const [text, setText] = useState(challengeSubmission || "");
  const [timeLeft, setTimeLeft] = useState(TIMER_SECS);
  const [started, setStarted] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!config || !challenge) router.replace("/setup");
  }, [hydrated, config, challenge, router]);

  useEffect(() => {
    if (!started) return;
    if (timeLeft <= 0) { setExpired(true); return; }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [started, timeLeft]);

  const handleSubmit = useCallback(() => {
    setChallengeSubmission(text);
    window.gtag?.("event", "challenge_submitted", { challenge_type: challenge?.type, profession: config?.profession });
    router.push("/report");
  }, [text, setChallengeSubmission, router, challenge, config]);

  if (!config || !challenge) return null;

  const isCode = challenge.type === "code";
  const timePct = (timeLeft / TIMER_SECS) * 100;
  const timerColor = timeLeft > 300 ? "#c49a2a" : timeLeft > 60 ? "#f97316" : "#e05252";
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return (
    <PageWrapper>
      <Header />

      {/* ── Thin accent bar ──────────────────── */}
      <div className="h-0.5 bg-accent" />

      <main className="max-w-4xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div className="mb-6">
          <BackButton href="/interview" label="Interview" />
        </div>

        {/* ── Top row ─────────────────────────── */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <div>
            <p className="label mb-2">Practical Challenge</p>
            <h1
              className="text-3xl sm:text-4xl font-light text-charcoal leading-tight"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              {challenge.title}
            </h1>
          </div>

          {/* Timer widget */}
          <div className="shrink-0">
            {!started ? (
              <button
                type="button"
                onClick={() => setStarted(true)}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                Start 15-min timer
              </button>
            ) : (
              <div className="flex flex-col items-end">
                <div className="relative w-20 h-20">
                  <svg width="80" height="80" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#ebe8e0" strokeWidth="5"/>
                    <circle
                      cx="40" cy="40" r="34" fill="none"
                      stroke={timerColor} strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - timePct / 100)}`}
                      style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="font-mono text-xs font-semibold tabular-nums"
                      style={{ color: timerColor }}
                    >
                      {fmt(timeLeft)}
                    </span>
                  </div>
                </div>
                {expired && (
                  <span className="text-xs text-muted mt-1">Time&apos;s up!</span>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Challenge brief card ─────────────── */}
        <motion.div
          className="card rounded-xl p-6 sm:p-8 mb-6 bg-gradient-to-br from-accent-light/40 to-surface"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 font-mono text-2xs tracking-widest uppercase text-charcoal bg-surface border border-border px-2.5 py-1 rounded-full">
              {config.level} {config.profession}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 font-mono text-2xs tracking-widest uppercase px-2.5 py-1 rounded-full border ${
                isCode
                  ? "text-info bg-info-light border-info/30"
                  : "text-success bg-success-light border-success/30"
              }`}
            >
              {isCode ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              )}
              {isCode ? `Code · ${challenge.language || ""}` : "Writing"}
            </span>
          </div>

          {challenge.context && (
            <p className="text-sm text-muted italic mb-4 flex items-start gap-2">
              <svg width="14" height="14" className="mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              {challenge.context}
            </p>
          )}

          <p
            className="text-base sm:text-lg text-charcoal leading-relaxed"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            {challenge.brief}
          </p>
        </motion.div>

        {expired && (
          <div className="flex items-center gap-2.5 bg-accent-light border border-accent-mid text-accent-hover rounded-md px-4 py-3 text-sm mb-6">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Time&apos;s up — wrap up and submit your best answer.
          </div>
        )}

        {/* ── Editor ───────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="label">Your Submission</label>
            {!isCode && (
              <span className="font-mono text-2xs text-muted">{wordCount} words</span>
            )}
          </div>

          {isCode ? (
            <div className="rounded-xl overflow-hidden border border-[#2a2a3a] shadow-card-lg">
              {/* macOS chrome */}
              <div className="bg-[#1e1e2e] px-4 py-3 flex items-center gap-3 border-b border-[#2a2a3a]">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="font-mono text-xs text-[#8888aa] ml-1">
                  {challenge.language ? `solution.${challenge.language === "javascript" ? "js" : challenge.language === "typescript" ? "ts" : challenge.language === "python" ? "py" : challenge.language}` : "solution.txt"}
                </span>
              </div>
              <CodeEditor
                value={text}
                language={challenge.language || "javascript"}
                placeholder={`// Write your ${challenge.language || "code"} solution here\n`}
                onChange={(e) => setText(e.target.value)}
                padding={20}
                style={{
                  fontSize: 13,
                  backgroundColor: "#0f1117",
                  color: "#cdd6f4",
                  fontFamily: "var(--font-mono), monospace",
                  minHeight: "400px",
                  lineHeight: 1.65,
                }}
              />
            </div>
          ) : (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write your response here. Be thorough, structured, and specific. Use examples, frameworks, and concrete details where relevant."
              rows={18}
              className="input-field resize-none leading-relaxed !py-5 !text-base"
            />
          )}
        </div>

        {/* ── Actions ──────────────────────────── */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary flex items-center gap-2 !px-8 !py-3"
          >
            Submit Challenge
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        <p className="text-center text-xs text-muted mt-5">
          You can submit with an incomplete answer — the AI will evaluate what you&apos;ve provided.
        </p>
      </main>
    </PageWrapper>
  );
}
