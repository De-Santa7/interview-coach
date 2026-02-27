"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageWrapper from "@/components/PageWrapper";
import Header from "@/components/Header";
import ReportView from "@/components/ReportView";
import { getHistoryEntry } from "@/lib/history";
import { HistoryEntry } from "@/lib/types";

function formatDate(ts: number) {
  return new Date(ts).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildCopyText(entry: HistoryEntry): string {
  const { config, report: r } = entry;
  const lines = [
    `INTERVIEW REPORT — ${config.level} ${config.profession}`,
    "=".repeat(50),
    "",
    `VERDICT: ${r.verdict}`,
    `OVERALL SCORE: ${r.overallScore}/100`,
    "",
    `RECOMMENDATION: ${r.recommendation}`,
    "",
    "STRENGTHS:",
    ...r.strengths.map((s) => `  • ${s}`),
    "",
    "AREAS TO IMPROVE:",
    ...r.improvements.map((i) => `  • ${i}`),
    "",
    "=".repeat(50),
    "QUESTION BREAKDOWN",
    "=".repeat(50),
    ...r.questions.flatMap((q, i) => [
      "",
      `Q${i + 1}: ${q.question}`,
      `Score: ${q.score}/10`,
      `Your Answer: ${q.answer}`,
      `Strengths: ${q.strengths.join(", ")}`,
      `Gaps: ${q.gaps.join(", ")}`,
      `Ideal: ${q.idealAnswer}`,
    ]),
  ];
  if (r.challenge) {
    lines.push(
      "",
      "=".repeat(50),
      "PRACTICAL CHALLENGE",
      "=".repeat(50),
      `Score: ${r.challenge.score}/10`,
      `Feedback: ${r.challenge.feedback}`,
      `Ideal: ${r.challenge.idealSubmission}`
    );
  }
  return lines.join("\n");
}

const LEVEL_ICONS: Record<string, string> = {
  "New Graduate": "🎓",
  Junior: "🌱",
  "Mid-Level": "⚡",
  Senior: "🔥",
  Lead: "🚀",
};

export default function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [entry, setEntry] = useState<HistoryEntry | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getHistoryEntry(id).then(setEntry);
  }, [id]);

  function copyReport() {
    if (!entry) return;
    navigator.clipboard.writeText(buildCopyText(entry)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Loading
  if (entry === undefined) return null;

  // Not found
  if (entry === null) {
    return (
      <PageWrapper>
        <Header />
        <main className="max-w-3xl mx-auto px-5 sm:px-8 py-20 text-center">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6"
            style={{
              background: "linear-gradient(135deg, #fee2e2, #fecaca)",
              border: "1px solid rgba(239,71,111,0.2)",
              boxShadow: "0 4px 20px rgba(239,71,111,0.15)",
            }}
          >
            🔍
          </div>
          <p className="text-2xl font-light text-charcoal mb-3" style={{ fontFamily: "var(--font-fraunces)" }}>
            Report not found
          </p>
          <p className="text-sm text-muted mb-8">
            This session may have been deleted or the link is invalid.
          </p>
          <Link href="/history" className="btn-primary inline-flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to History
          </Link>
        </main>
      </PageWrapper>
    );
  }

  const levelIcon = LEVEL_ICONS[entry.config.level] || "🎯";

  return (
    <PageWrapper>
      <Header />
      {/* Gradient accent bar */}
      <div className="h-1" style={{ background: "linear-gradient(90deg, #e8b923, #00b4d8)" }} />

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-16">

        {/* Back + metadata header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            href="/history"
            className="inline-flex items-center gap-1.5 text-sm text-body hover:text-charcoal transition-colors group mb-5"
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
              className="group-hover:-translate-x-0.5 transition-transform duration-150"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            History
          </Link>

          {/* Session info banner */}
          <div
            className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{
              background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                {levelIcon}
              </div>
              <div>
                <p className="font-mono text-[10px] text-white/40 tracking-widest uppercase mb-0.5">Session Report</p>
                <h1
                  className="text-lg font-light text-white"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  {entry.config.level} {entry.config.profession}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs text-white/50 border border-white/20 px-2 py-0.5 rounded-full">
                    {entry.config.interviewType}
                  </span>
                  <span className="font-mono text-xs text-white/50 border border-white/20 px-2 py-0.5 rounded-full">
                    {entry.config.questionCount}Q
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs text-white/40 mb-1">Completed</p>
              <p className="font-mono text-sm text-white/70">{formatDate(entry.timestamp)}</p>
            </div>
          </div>
        </motion.div>

        <ReportView config={entry.config} report={entry.report} />

        {/* Action bar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
          <button
            type="button"
            onClick={copyReport}
            className="btn-secondary flex items-center justify-center gap-2 flex-1"
          >
            {copied ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3d9970" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copy Report
              </>
            )}
          </button>
          <Link
            href="/setup"
            className="btn-primary flex items-center justify-center gap-2 flex-1 text-center"
          >
            Start New Session
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </main>
    </PageWrapper>
  );
}
