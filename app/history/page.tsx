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

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setEntries(loadHistory());
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
              className="text-3xl font-light text-charcoal"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Past Reports
            </h1>
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
              {confirmClear ? "Confirm clear all?" : "Clear all"}
            </motion.button>
          )}
        </motion.div>

        {/* Empty state */}
        {entries.length === 0 && (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent-light border border-accent-mid mb-6">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c49a2a" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <p
              className="text-xl font-light text-charcoal mb-3"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              No sessions yet
            </p>
            <p className="text-sm text-muted mb-8">
              Complete an interview to see your report saved here automatically.
            </p>
            <Link href="/setup" className="btn-primary inline-flex items-center gap-2">
              Start an Interview
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        )}

        {/* Cards grid */}
        {entries.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-5">
            <AnimatePresence initial={false}>
            {entries.map((entry, i) => (
              <motion.div
                key={entry.id}
                className="card rounded-xl overflow-hidden flex flex-col"
                initial={{ opacity: 0, y: 22, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                layout
              >
                {/* Card header */}
                <div className="px-5 py-4 border-b border-border">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h2
                      className="text-base font-light text-charcoal leading-snug"
                      style={{ fontFamily: "var(--font-fraunces)" }}
                    >
                      {entry.config.level} {entry.config.profession}
                    </h2>
                    <VerdictBadge verdict={entry.report.verdict} />
                  </div>
                  <p className="font-mono text-2xs text-muted">{formatDate(entry.timestamp)}</p>
                </div>

                {/* Card body */}
                <div className="px-5 py-4 flex-1 space-y-3">
                  {/* Score + avg */}
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted">Overall</span>
                    <span className="font-mono text-sm font-semibold text-charcoal">
                      {entry.report.overallScore}
                      <span className="text-muted font-normal">/100</span>
                    </span>
                    <span className="text-border">·</span>
                    <span className="font-mono text-xs text-muted">Avg Q</span>
                    <span className="font-mono text-sm font-semibold text-charcoal">
                      {avgScore(entry)}
                      <span className="text-muted font-normal">/10</span>
                    </span>
                  </div>

                  {/* Recommendation quote */}
                  <p className="text-sm text-body leading-relaxed line-clamp-2 italic">
                    &ldquo;{entry.report.recommendation}&rdquo;
                  </p>
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
      </main>
    </PageWrapper>
  );
}
