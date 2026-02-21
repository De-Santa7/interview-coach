"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import ScoreRing from "@/components/ScoreRing";
import { FullReport, SessionConfig } from "@/lib/types";

function ScorePill({ score }: { score: number }) {
  const [bg, text, border] =
    score >= 8
      ? ["#edf7f3", "#1e6647", "#a7d9c3"]
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

interface ReportViewProps {
  config: SessionConfig;
  report: FullReport;
}

export default function ReportView({ config, report: r }: ReportViewProps) {
  const [activeTab, setActiveTab] = useState<"interview" | "challenge">("interview");

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
  const bannerBg = isStrongHire
    ? "bg-success-light border-success/25"
    : isHire
    ? "bg-info-light border-info/25"
    : isMaybe
    ? "bg-accent-light border-accent/25"
    : "bg-danger-light border-danger/25";
  const verdictColor = isStrongHire
    ? "text-success"
    : isHire
    ? "text-info"
    : isMaybe
    ? "text-accent"
    : "text-danger";

  return (
    <>
      {/* ── Verdict hero ─────────────────────── */}
      <motion.div className="mb-10" {...revealUp()}>

        {/* Full-width colour-coded verdict banner */}
        <div className={`rounded-2xl border px-8 py-14 text-center mb-8 ${bannerBg}`}>
          <p className="font-mono text-2xs tracking-widest uppercase text-muted mb-5">
            Hiring Verdict
          </p>
          <h1
            className={`text-6xl sm:text-7xl lg:text-[5.5rem] font-light leading-none tracking-tight mb-5 ${verdictColor}`}
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            {r.verdict}
          </h1>
          <p className="font-mono text-xs text-muted">
            {config.level} {config.profession}&ensp;&middot;&ensp;
            {config.questionCount} questions&ensp;&middot;&ensp;
            {config.interviewType}
            {config.includeChallenge && <>&ensp;&middot;&ensp;practical challenge</>}
          </p>
        </div>

        {/* Score ring + recommendation + strengths/improvements */}
        <div className="card-md rounded-xl p-8 flex flex-col sm:flex-row items-center gap-8 text-left">
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
                <p className="font-mono text-2xs text-success tracking-widest uppercase mb-2.5">Top Strengths</p>
                <ul className="space-y-2">
                  {r.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-charcoal">
                      <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-success-light flex items-center justify-center">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#3d9970" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-mono text-2xs text-danger tracking-widest uppercase mb-2.5">To Improve</p>
                <ul className="space-y-2">
                  {r.improvements.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-charcoal">
                      <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-danger-light flex items-center justify-center">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#e05252" strokeWidth="3">
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
              <div className="px-6 py-4 border-b border-border flex items-start justify-between gap-4">
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
                    <p className="font-mono text-2xs text-success tracking-widest uppercase mb-2">What Worked</p>
                    <ul className="space-y-1.5">
                      {q.strengths.map((s, j) => (
                        <li key={j} className="text-sm text-charcoal flex gap-2 items-start">
                          <span className="text-success shrink-0 mt-0.5">✓</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-md p-4 border-l-2 border-danger bg-danger-light/50">
                    <p className="font-mono text-2xs text-danger tracking-widest uppercase mb-2">What Was Missing</p>
                    <ul className="space-y-1.5">
                      {q.gaps.map((g, j) => (
                        <li key={j} className="text-sm text-charcoal flex gap-2 items-start">
                          <span className="text-danger shrink-0 mt-0.5">–</span>{g}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-md p-4 border-l-2 border-info bg-info-light/50">
                  <p className="font-mono text-2xs text-info tracking-widest uppercase mb-2">Ideal Answer</p>
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
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
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
                <p className="font-mono text-2xs text-accent tracking-widest uppercase mb-2">Feedback</p>
                <p className="text-sm text-charcoal leading-relaxed">{r.challenge.feedback}</p>
              </div>
              <div className="rounded-md p-4 border-l-2 border-info bg-info-light/50">
                <p className="font-mono text-2xs text-info tracking-widest uppercase mb-2">What Great Looks Like</p>
                <p className="text-sm text-body leading-relaxed italic">{r.challenge.idealSubmission}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}
