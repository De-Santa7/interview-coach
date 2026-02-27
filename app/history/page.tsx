"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import PageWrapper from "@/components/PageWrapper";
import Header from "@/components/Header";
import VerdictBadge from "@/components/VerdictBadge";
import { loadHistory, deleteHistoryEntry, clearHistory } from "@/lib/history";
import { HistoryEntry } from "@/lib/types";

function formatDate(ts: number) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function avgScore(entry: HistoryEntry) {
  const qs = entry.report.questions;
  if (!qs.length) return 0;
  return Math.round((qs.reduce((a, q) => a + q.score, 0) / qs.length) * 10) / 10;
}

function scoreBarColor(score: number) {
  if (score >= 80) return "linear-gradient(90deg, #06d6a0, #00b4d8)";
  if (score >= 60) return "linear-gradient(90deg, #e8b923, #00b4d8)";
  if (score >= 40) return "linear-gradient(90deg, #ffd166, #e8b923)";
  return "linear-gradient(90deg, #ef476f, #c0392b)";
}

const LEVEL_ICONS: Record<string, string> = {
  "New Graduate": "🎓",
  Junior: "🌱",
  "Mid-Level": "⚡",
  Senior: "🔥",
  Lead: "🚀",
};

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    loadHistory().then(setEntries);
  }, []);

  function handleDelete(id: string) {
    deleteHistoryEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function handleClearAll() {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearHistory();
    setEntries([]);
    setConfirmClear(false);
  }

  return (
    <PageWrapper>
      <Header />
      <main className="max-w-4xl mx-auto px-5 sm:px-8 py-12 sm:py-16">

        {/* Page header */}
        <motion.div
          className="flex items-start justify-between gap-4 mb-10"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <div>
            <p className="label mb-2">Session History</p>
            <h1
              className="text-3xl sm:text-4xl font-light text-charcoal"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Past Reports
            </h1>
            {entries.length > 0 && (
              <p className="text-sm text-muted mt-1">{entries.length} session{entries.length !== 1 ? "s" : ""} completed</p>
            )}
          </div>
          {entries.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={handleClearAll}
              className={`btn-secondary !text-xs !py-1.5 !px-3 shrink-0 mt-1 ${
                confirmClear ? "!border-danger/50 !text-danger" : ""
              }`}
            >
              {confirmClear ? "⚠️ Confirm clear all?" : "Clear all"}
            </motion.button>
          )}
        </motion.div>

        {/* Empty state */}
        {entries.length === 0 && (
          <motion.div
            className="text-center py-24"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 text-4xl"
              style={{
                background: "linear-gradient(135deg, #fef8ec, #f8f6f0)",
                border: "1px solid var(--c-accent-mid)",
                boxShadow: "0 4px 20px rgba(232,185,35,0.15)",
              }}
            >
              📋
            </div>
            <p
              className="text-2xl font-light text-charcoal mb-3"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              No sessions yet
            </p>
            <p className="text-sm text-muted mb-8 max-w-xs mx-auto">
              Complete an interview to see your report saved here automatically.
            </p>
            <Link href="/setup" className="btn-primary inline-flex items-center gap-2 !px-8 !py-3">
              Start an Interview
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </motion.div>
        )}

        {/* Cards grid */}
        {entries.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-5">
            <AnimatePresence initial={false}>
            {entries.map((entry, i) => (
              <motion.div
                key={entry.id}
                className="relative flex flex-col overflow-hidden"
                style={{
                  background: "linear-gradient(145deg, #ffffff, #f8f6f0)",
                  border: "1px solid var(--c-border)",
                  borderRadius: "18px",
                  boxShadow: "var(--shadow-card)",
                  transition: "all 0.2s ease",
                }}
                initial={{ opacity: 0, y: 22, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4, boxShadow: "var(--shadow-card-hover)" }}
                layout
              >
                {/* Score bar at top */}
                <div className="h-1 w-full" style={{ background: scoreBarColor(entry.report.overallScore) }} />

                {/* Card header */}
                <div className="px-5 py-4 border-b border-border">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{LEVEL_ICONS[entry.config.level] || "🎯"}</span>
                      <h2
                        className="text-base font-light text-charcoal leading-snug"
                        style={{ fontFamily: "var(--font-fraunces)" }}
                      >
                        {entry.config.level} {entry.config.profession}
                      </h2>
                    </div>
                    <VerdictBadge verdict={entry.report.verdict} />
                  </div>
                  <p className="font-mono text-2xs text-muted">{formatDate(entry.timestamp)}</p>
                </div>

                {/* Card body */}
                <div className="px-5 py-4 flex-1 space-y-3">
                  {/* Score display */}
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div
                        className="text-2xl font-light"
                        style={{ fontFamily: "var(--font-fraunces)", background: scoreBarColor(entry.report.overallScore), WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                      >
                        {entry.report.overallScore}
                      </div>
                      <div className="text-[10px] font-mono text-muted tracking-wide uppercase">Overall</div>
                    </div>
                    <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                      <motion.div
                        className="h-2 rounded-full"
                        style={{ background: scoreBarColor(entry.report.overallScore) }}
                        initial={{ width: 0 }}
                        animate={{ width: `${entry.report.overallScore}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-light text-charcoal" style={{ fontFamily: "var(--font-fraunces)" }}>
                        {avgScore(entry)}/10
                      </div>
                      <div className="text-[10px] font-mono text-muted tracking-wide uppercase">Avg Q</div>
                    </div>
                  </div>

                  {/* Recommendation quote */}
                  <p className="text-sm text-body leading-relaxed line-clamp-2 italic">
                    &ldquo;{entry.report.recommendation}&rdquo;
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="font-mono text-[10px] bg-bg border border-border text-muted px-2 py-0.5 rounded-full tracking-wide">
                      {entry.config.interviewType}
                    </span>
                    <span className="font-mono text-[10px] bg-bg border border-border text-muted px-2 py-0.5 rounded-full tracking-wide">
                      {entry.config.questionCount}Q
                    </span>
                    {entry.config.includeChallenge && (
                      <span className="font-mono text-[10px] bg-teal-light border border-teal/20 text-teal px-2 py-0.5 rounded-full tracking-wide">
                        + Challenge
                      </span>
                    )}
                  </div>
                </div>

                {/* Card footer */}
                <div className="px-5 py-3 border-t border-border flex items-center justify-between gap-3">
                  <Link
                    href={`/history/${entry.id}`}
                    className="btn-primary !py-1.5 !px-4 !text-xs inline-flex items-center gap-1.5"
                  >
                    View Report
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    className="p-1.5 rounded-md text-muted hover:text-danger hover:bg-danger-light transition-colors"
                    aria-label="Delete session"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        )}

        {/* Start new session CTA */}
        {entries.length > 0 && (
          <motion.div
            className="text-center mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Link href="/setup" className="btn-primary !px-10 !py-3">
              Start a New Session →
            </Link>
          </motion.div>
        )}
      </main>
    </PageWrapper>
  );
}
