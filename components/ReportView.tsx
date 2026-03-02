"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ScoreRing from "@/components/ScoreRing";
import { FullReport, SessionConfig, IntegrityData } from "@/lib/types";

const INTEGRITY_KEY = "interview-coach-integrity";

function ScorePill({ score }: { score: number }) {
  const [bg, text, border] =
    score >= 8
      ? ["#edf7f3", "#0e5c38", "#7dd4b0"]
      : score >= 6
      ? ["#fef8ec", "#7a5b12", "#e8c96a"]
      : score >= 4
      ? ["#fff7ed", "#9a4f1a", "#fbc99a"]
      : ["#fdf2f2", "#8b2222", "#f4aaaa"];
  return (
    <span
      className="font-mono text-xs font-semibold px-2.5 py-1 rounded-full border inline-flex items-center"
      style={{ background: bg, color: text, borderColor: border }}
    >
      {score}/10
    </span>
  );
}

/* ── Confetti ─────────────────────────────────────── */
function Confetti() {
  const colors = ["#e8b923", "#06d6a0", "#00b4d8", "#ef476f", "#ffd166", "#118ab2"];
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 2.5 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 6 + Math.random() * 8,
    rotate: Math.random() * 360,
  }));

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            backgroundColor: p.color,
            width: `${p.size}px`,
            height: `${p.size}px`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Integrity Report Section ───────────────────── */
function IntegritySection({ data }: { data: IntegrityData }) {
  const faceAbsenceSecs = Math.round(data.totalFaceAbsenceMs / 1000);
  const faceLeaveCount = data.events.filter((e) => e.type === "face_left" || e.type === "gaze_away").length;

  const verdictColor =
    data.verdict === "High Integrity"
      ? { bg: "#edf7f3", text: "#0e5c38", border: "#7dd4b0", icon: "✅" }
      : data.verdict === "Medium Integrity"
      ? { bg: "#fffbeb", text: "#7a5b12", border: "#e8c96a", icon: "⚠️" }
      : { bg: "#fdf2f2", text: "#8b2222", border: "#f4aaaa", icon: "❌" };

  return (
    <motion.div
      className="card rounded-xl overflow-hidden mb-8"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center gap-3"
        style={{ background: "linear-gradient(145deg, #ffffff, #f8f6f0)" }}
      >
        <div className="w-8 h-8 rounded-full bg-teal-light border border-teal/20 flex items-center justify-center text-sm">
          👁
        </div>
        <div>
          <p className="text-sm font-semibold text-charcoal">Integrity Report</p>
          <p className="text-xs text-muted">Webcam monitoring analysis</p>
        </div>
        <span
          className="ml-auto font-mono text-xs font-semibold px-3 py-1 rounded-full border"
          style={{ background: verdictColor.bg, color: verdictColor.text, borderColor: verdictColor.border }}
        >
          {verdictColor.icon} {data.verdict}
        </span>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5">
          {/* Integrity score */}
          <div className="text-center p-2.5 sm:p-4 rounded-xl border border-border bg-bg">
            <div
              className="text-2xl sm:text-3xl font-light mb-1"
              style={{ fontFamily: "var(--font-fraunces)", color: data.score >= 85 ? "#06d6a0" : data.score >= 60 ? "#e8b923" : "#ef476f" }}
            >
              {data.score}%
            </div>
            <p className="text-[10px] sm:text-xs text-muted font-mono tracking-wide uppercase leading-tight">Integrity Score</p>
          </div>

          {/* Times left frame */}
          <div className="text-center p-2.5 sm:p-4 rounded-xl border border-border bg-bg">
            <div className="text-2xl sm:text-3xl font-light text-charcoal mb-1" style={{ fontFamily: "var(--font-fraunces)" }}>
              {faceLeaveCount}
            </div>
            <p className="text-[10px] sm:text-xs text-muted font-mono tracking-wide uppercase leading-tight">Looked Away</p>
          </div>

          {/* Time away */}
          <div className="text-center p-2.5 sm:p-4 rounded-xl border border-border bg-bg">
            <div className="text-2xl sm:text-3xl font-light text-charcoal mb-1" style={{ fontFamily: "var(--font-fraunces)" }}>
              {faceAbsenceSecs}s
            </div>
            <p className="text-[10px] sm:text-xs text-muted font-mono tracking-wide uppercase leading-tight">Time Away</p>
          </div>
        </div>

        {/* Warnings */}
        <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-bg">
          <span className="text-sm">
            {data.warningCount === 0 ? "✅" : data.warningCount <= 2 ? "⚠️" : "🚨"}
          </span>
          <p className="text-sm text-charcoal">
            <span className="font-semibold">{data.warningCount} warning{data.warningCount !== 1 ? "s" : ""}</span> issued during the interview
          </p>
        </div>

        {/* Score bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted font-mono mb-1.5">
            <span>Integrity</span>
            <span>{data.score}%</span>
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-1000"
              style={{
                width: `${data.score}%`,
                background: data.score >= 85
                  ? "linear-gradient(90deg, #06d6a0, #00b4d8)"
                  : data.score >= 60
                  ? "linear-gradient(90deg, #ffd166, #e8b923)"
                  : "linear-gradient(90deg, #ef476f, #c0392b)",
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface ReportViewProps {
  config: SessionConfig;
  report: FullReport;
  integrityDataProp?: IntegrityData | null;
}

export default function ReportView({ config, report: r, integrityDataProp }: ReportViewProps) {
  const [activeTab, setActiveTab] = useState<"interview" | "challenge">("interview");
  const [integrityData, setIntegrityData] = useState<IntegrityData | null>(integrityDataProp ?? null);
  const showConfetti = r.verdict === "Strong Hire" || r.verdict === "Hire";

  useEffect(() => {
    // Try localStorage first (same-device session), fall back to prop (cross-device/history)
    try {
      const raw = localStorage.getItem(INTEGRITY_KEY);
      if (raw) {
        setIntegrityData(JSON.parse(raw) as IntegrityData);
        return;
      }
    } catch { /* ignore */ }
    if (integrityDataProp) setIntegrityData(integrityDataProp);
  }, [integrityDataProp]);

  const revealUp = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  /* Verdict colour palette */
  const isStrongHire = r.verdict === "Strong Hire";
  const isHire = r.verdict === "Hire";
  const isMaybe = r.verdict === "Maybe";

  const verdictClass = isStrongHire
    ? "verdict-strong-hire"
    : isHire
    ? "verdict-hire"
    : isMaybe
    ? "verdict-maybe"
    : "verdict-no-hire";

  const verdictTextColor = "text-white";

  return (
    <>
      {/* Confetti for good verdicts */}
      {showConfetti && <Confetti />}

      {/* ── Verdict hero ─────────────────────── */}
      <motion.div className="mb-10" {...revealUp()}>

        {/* Full-width animated gradient verdict banner */}
        <div className={`rounded-2xl px-8 py-14 text-center mb-8 ${verdictClass}`}>
          <p className="font-mono text-2xs tracking-widest uppercase text-white/70 mb-5">
            Hiring Verdict
          </p>
          <h1
            className={`text-6xl sm:text-7xl lg:text-[5.5rem] font-light leading-none tracking-tight mb-5 ${verdictTextColor}`}
            style={{ fontFamily: "var(--font-fraunces)", textShadow: "0 2px 20px rgba(0,0,0,0.2)" }}
          >
            {r.verdict}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1">
            <span className="font-mono text-xs text-white/70 border border-white/25 bg-white/10 px-2.5 py-0.5 rounded-full whitespace-nowrap">
              {config.level} {config.profession}
            </span>
            <span className="font-mono text-xs text-white/70 border border-white/25 bg-white/10 px-2.5 py-0.5 rounded-full whitespace-nowrap">
              {config.questionCount} questions
            </span>
            <span className="font-mono text-xs text-white/70 border border-white/25 bg-white/10 px-2.5 py-0.5 rounded-full whitespace-nowrap">
              {config.interviewType}
            </span>
            {config.includeChallenge && (
              <span className="font-mono text-xs text-white/70 border border-white/25 bg-white/10 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                + challenge
              </span>
            )}
          </div>
          {showConfetti && (
            <p className="text-white/80 text-sm mt-4 font-medium">🎉 Congratulations!</p>
          )}
        </div>

        {/* Score ring + recommendation + strengths/improvements */}
        <div
          className="rounded-xl p-8 flex flex-col sm:flex-row items-center gap-8 text-left"
          style={{
            background: "linear-gradient(145deg, #ffffff, #f8f6f0)",
            boxShadow: "var(--shadow-card-md)",
            border: "1px solid var(--c-border)",
          }}
        >
          <ScoreRing score={r.overallScore} size={140} label="Overall Score" />
          <div className="flex-1">
            <p
              className="text-xl font-light text-charcoal leading-relaxed mb-5 italic"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              &ldquo;{r.recommendation}&rdquo;
            </p>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <p className="font-mono text-2xs text-success tracking-widest uppercase mb-2.5">✅ Top Strengths</p>
                <ul className="space-y-2">
                  {r.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-charcoal">
                      <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-success-light flex items-center justify-center">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#06d6a0" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-mono text-2xs text-danger tracking-widest uppercase mb-2.5">⚠️ To Improve</p>
                <ul className="space-y-2">
                  {r.improvements.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-charcoal">
                      <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-danger-light flex items-center justify-center">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ef476f" strokeWidth="3">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Tab nav (if challenge exists) ─────── */}
      {r.challenge && (
        <motion.div className="seg-control mb-8 w-full !rounded-lg !p-1" {...revealUp(0.05)}>
          <button
            type="button"
            className={`seg-btn flex-1 !px-4 !py-2 !text-sm ${activeTab === "interview" ? "active" : ""}`}
            onClick={() => setActiveTab("interview")}
          >
            Interview ({r.questions.length} questions)
          </button>
          <button
            type="button"
            className={`seg-btn flex-1 !px-4 !py-2 !text-sm ${activeTab === "challenge" ? "active" : ""}`}
            onClick={() => setActiveTab("challenge")}
          >
            Practical Challenge
          </button>
        </motion.div>
      )}

      {/* ── Question breakdown ────────────────── */}
      {(!r.challenge || activeTab === "interview") && (
        <motion.div className="space-y-5 mb-10" {...revealUp(0.08)}>
          <h2
            className="text-2xl font-light text-charcoal mb-6"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Interview Breakdown
          </h2>
          {r.questions.map((q, i) => (
            <motion.div
              key={i}
              className="card rounded-xl overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.42, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as const }}
            >
              <div
                className="px-6 py-4 border-b border-border flex items-start justify-between gap-4"
                style={{ background: "linear-gradient(145deg, #ffffff, #f8f6f0)" }}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="font-mono text-2xs text-muted shrink-0 mt-1">Q{i + 1}</span>
                  <p
                    className="text-base font-light text-charcoal leading-snug"
                    style={{ fontFamily: "var(--font-fraunces)" }}
                  >
                    {q.question}
                  </p>
                </div>
                <ScorePill score={q.score} />
              </div>

              <div className="p-6 space-y-5">
                <div className="bg-bg rounded-md p-4 border border-border">
                  <p className="font-mono text-2xs text-muted tracking-widest uppercase mb-2">Your Answer</p>
                  <p className="text-sm text-charcoal leading-relaxed">{q.answer || "(No answer provided)"}</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-md p-4 border-l-2 border-success bg-success-light/50">
                    <p className="font-mono text-2xs text-success tracking-widest uppercase mb-2">✅ What Worked</p>
                    <ul className="space-y-1.5">
                      {q.strengths.map((s, j) => (
                        <li key={j} className="text-sm text-charcoal flex gap-2 items-start">
                          <span className="text-success shrink-0 mt-0.5">✓</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-md p-4 border-l-2 border-danger bg-danger-light/50">
                    <p className="font-mono text-2xs text-danger tracking-widest uppercase mb-2">⚠️ What Was Missing</p>
                    <ul className="space-y-1.5">
                      {q.gaps.map((g, j) => (
                        <li key={j} className="text-sm text-charcoal flex gap-2 items-start">
                          <span className="text-danger shrink-0 mt-0.5">–</span>{g}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-md p-4 border-l-2 border-teal bg-teal-light/40">
                  <p className="font-mono text-2xs text-teal tracking-widest uppercase mb-2">💡 Ideal Answer</p>
                  <p className="text-sm text-body leading-relaxed italic">{q.idealAnswer}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Challenge breakdown ───────────────── */}
      {r.challenge && activeTab === "challenge" && (
        <motion.div className="mb-10" {...revealUp()}>
          <h2
            className="text-2xl font-light text-charcoal mb-6"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Challenge Evaluation
          </h2>
          <div className="card rounded-xl overflow-hidden">
            <div
              className="px-6 py-4 border-b border-border flex items-center justify-between"
              style={{ background: "linear-gradient(145deg, #ffffff, #f8f6f0)" }}
            >
              <p className="font-mono text-2xs text-muted tracking-widest uppercase">Practical Challenge Score</p>
              <ScorePill score={r.challenge.score} />
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-accent-light/40 rounded-md p-4 border border-accent-mid">
                <p className="font-mono text-2xs text-muted tracking-widest uppercase mb-2">Challenge Brief</p>
                <p className="text-sm text-charcoal leading-relaxed">{r.challenge.brief}</p>
              </div>
              {r.challenge.submission && (
                <div className="bg-bg rounded-md p-4 border border-border">
                  <p className="font-mono text-2xs text-muted tracking-widest uppercase mb-2">Your Submission</p>
                  <pre className="text-sm text-charcoal leading-relaxed whitespace-pre-wrap font-mono">
                    {r.challenge.submission}
                  </pre>
                </div>
              )}
              <div className="rounded-md p-4 border-l-2 border-accent bg-accent-light/30">
                <p className="font-mono text-2xs text-accent-hover tracking-widest uppercase mb-2">⚡ Feedback</p>
                <p className="text-sm text-charcoal leading-relaxed">{r.challenge.feedback}</p>
              </div>
              <div className="rounded-md p-4 border-l-2 border-teal bg-teal-light/40">
                <p className="font-mono text-2xs text-teal tracking-widest uppercase mb-2">💡 What Great Looks Like</p>
                <p className="text-sm text-body leading-relaxed italic">{r.challenge.idealSubmission}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Integrity Report ──────────────────── */}
      {integrityData && <IntegritySection data={integrityData} />}
    </>
  );
}
