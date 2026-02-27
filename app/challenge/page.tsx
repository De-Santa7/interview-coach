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

const ROLE_ICONS: Record<string, string> = {
  code: "💻",
  writing: "✍️",
};

const TYPE_LABELS: Record<string, string> = {
  code: "Code Challenge",
  writing: "Writing Task",
};

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
  const timerColor = timeLeft > 300 ? "#e8b923" : timeLeft > 60 ? "#ffd166" : "#ef476f";
  const timerGradStart = timeLeft > 300 ? "#e8b923" : timeLeft > 60 ? "#ffd166" : "#ef476f";
  const timerGradEnd = timeLeft > 300 ? "#00b4d8" : timeLeft > 60 ? "#e8b923" : "#c0392b";
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const gradId = `timer-grad-${timeLeft > 300 ? "a" : timeLeft > 60 ? "b" : "c"}`;

  return (
    <PageWrapper>
      <Header />

      {/* Gradient accent bar */}
      <div className="h-1" style={{ background: "linear-gradient(90deg, #e8b923, #00b4d8)" }} />

      <main className="max-w-4xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div className="mb-6">
          <BackButton href="/interview" label="Interview" />
        </div>

        {/* Hero header card */}
        <motion.div
          className="relative rounded-2xl overflow-hidden mb-8 p-8"
          style={{
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          }}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse 60% 60% at 20% 50%, rgba(232,185,35,0.12) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 80% 50%, rgba(0,180,216,0.1) 0%, transparent 70%)",
          }} />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
                >
                  {ROLE_ICONS[challenge.type]}
                </div>
                <div>
                  <p className="font-mono text-[10px] text-white/40 tracking-widest uppercase">{TYPE_LABELS[challenge.type]}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs text-white/60 border border-white/20 px-2 py-0.5 rounded-full">
                      {config.level} {config.profession}
                    </span>
                    {isCode && challenge.language && (
                      <span
                        className="font-mono text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(0,180,216,0.2)", color: "#7dd5f0", border: "1px solid rgba(0,180,216,0.3)" }}
                      >
                        {challenge.language}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <h1
                className="text-2xl sm:text-3xl font-light text-white leading-tight"
                style={{ fontFamily: "var(--font-fraunces)" }}
              >
                {challenge.title}
              </h1>
            </div>

            {/* Timer */}
            <div className="shrink-0 flex flex-col items-center">
              {!started ? (
                <button
                  type="button"
                  onClick={() => setStarted(true)}
                  className="flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl text-white border border-white/20 bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Start 15-min timer
                </button>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20">
                    <svg width="80" height="80" style={{ transform: "rotate(-90deg)" }}>
                      <defs>
                        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={timerGradStart} />
                          <stop offset="100%" stopColor={timerGradEnd} />
                        </linearGradient>
                      </defs>
                      <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="5"/>
                      <circle
                        cx="40" cy="40" r="34" fill="none"
                        stroke={`url(#${gradId})`} strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 34}`}
                        strokeDashoffset={`${2 * Math.PI * 34 * (1 - timePct / 100)}`}
                        style={{ transition: "stroke-dashoffset 1s linear" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-mono text-xs font-semibold tabular-nums" style={{ color: timerColor }}>
                        {fmt(timeLeft)}
                      </span>
                    </div>
                  </div>
                  {expired && (
                    <span className="text-xs text-warning mt-1 font-medium">Time&apos;s up!</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Challenge brief card */}
        <motion.div
          className="rounded-xl p-6 sm:p-8 mb-6"
          style={{
            background: "linear-gradient(145deg, #ffffff, #f8f6f0)",
            border: "1px solid var(--c-border)",
            boxShadow: "var(--shadow-card-md)",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          {challenge.context && (
            <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-teal-light/50 border border-teal/20">
              <span className="text-teal mt-0.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              </span>
              <p className="text-sm text-teal leading-relaxed">{challenge.context}</p>
            </div>
          )}

          <p
            className="text-base sm:text-lg text-charcoal leading-relaxed"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            {challenge.brief}
          </p>
        </motion.div>

        {expired && (
          <div
            className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm mb-6"
            style={{ background: "var(--c-warning-light)", border: "1px solid rgba(255,209,102,0.5)", color: "#7a5b12" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Time&apos;s up — wrap up and submit your best answer.
          </div>
        )}

        {/* Editor */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="label">Your Submission</label>
            {!isCode && (
              <span className="font-mono text-2xs text-muted">{wordCount} words</span>
            )}
          </div>

          {isCode ? (
            <div className="rounded-xl overflow-hidden shadow-card-lg" style={{ border: "1px solid #2a2a3a" }}>
              {/* macOS chrome */}
              <div className="bg-[#1e1e2e] px-4 py-3 flex items-center justify-between border-b border-[#2a2a3a]">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="font-mono text-xs text-[#8888aa]">
                  {challenge.language ? `solution.${challenge.language === "javascript" ? "js" : challenge.language === "typescript" ? "ts" : challenge.language === "python" ? "py" : challenge.language}` : "solution.txt"}
                </span>
                <span className="font-mono text-[10px] text-[#6666aa] uppercase tracking-wider">
                  {challenge.language || "text"}
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
              className="input-field resize-none leading-relaxed !py-5 !text-base !rounded-xl"
            />
          )}
        </div>

        {/* Actions */}
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
