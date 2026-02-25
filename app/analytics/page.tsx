"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import Header from "@/components/Header";
import { loadHistory } from "@/lib/history";
import { HistoryEntry } from "@/lib/types";

/* ── Helpers ───────────────────────────────────── */
function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function avg(nums: number[]) {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

/* ── Derived analytics from local history ──────── */
interface Analytics {
  totalSessions: number;
  avgScore: number;
  avgTimeSecs: number;
  bestScore: number;
  scoreOverTime: { date: string; score: number }[];
  scoreByProfession: { profession: string; score: number; count: number }[];
  scoreByType: { type: string; score: number }[];
  activityMap: Record<string, number>; // "YYYY-MM-DD" → sessions
  fastestAnswer: { question: string; secs: number } | null;
  slowestAnswer: { question: string; secs: number } | null;
}

function buildAnalytics(history: HistoryEntry[]): Analytics {
  const totalSessions = history.length;
  const scores = history.map((h) => h.report.overallScore);
  const avgScore = avg(scores);
  const bestScore = scores.length ? Math.max(...scores) : 0;

  // Score over time (last 10)
  const scoreOverTime = history
    .slice(0, 10)
    .reverse()
    .map((h) => ({ date: fmtDate(h.timestamp), score: h.report.overallScore }));

  // Score by profession
  const byProf: Record<string, number[]> = {};
  history.forEach((h) => {
    const p = h.config.profession;
    if (!byProf[p]) byProf[p] = [];
    byProf[p].push(h.report.overallScore);
  });
  const scoreByProfession = Object.entries(byProf)
    .map(([profession, s]) => ({ profession, score: avg(s), count: s.length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  // Score by interview type
  const byType: Record<string, number[]> = {};
  history.forEach((h) => {
    const t = h.config.interviewType;
    if (!byType[t]) byType[t] = [];
    byType[t].push(h.report.overallScore);
  });
  const scoreByType = Object.entries(byType).map(([type, s]) => ({ type, score: avg(s) }));

  // Average answer time
  const allTimes: number[] = [];
  history.forEach((h) =>
    h.answers.forEach((a) => { if (a.timeTaken) allTimes.push(a.timeTaken); })
  );
  const avgTimeSecs = avg(allTimes);

  // Activity map: last 365 days
  const activityMap: Record<string, number> = {};
  history.forEach((h) => {
    const d = new Date(h.timestamp).toISOString().split("T")[0];
    activityMap[d] = (activityMap[d] ?? 0) + 1;
  });

  // Fastest / slowest answers
  type TimedAnswer = { question: string; secs: number };
  let fastest: TimedAnswer | null = null;
  let slowest: TimedAnswer | null = null;
  history.forEach((h) => {
    h.answers.forEach((a) => {
      if (!a.timeTaken) return;
      const q = h.questions.find((qu) => qu.id === a.questionId);
      if (!q) return;
      if (!fastest || a.timeTaken < fastest.secs) fastest = { question: q.text, secs: a.timeTaken };
      if (!slowest || a.timeTaken > slowest.secs) slowest = { question: q.text, secs: a.timeTaken };
    });
  });

  return { totalSessions, avgScore, avgTimeSecs, bestScore, scoreOverTime, scoreByProfession, scoreByType, activityMap, fastestAnswer: fastest, slowestAnswer: slowest };
}

/* ── Stat card ─────────────────────────────────── */
function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card-md rounded-xl p-5">
      <p className="text-xs text-muted font-mono tracking-wider uppercase mb-1">{label}</p>
      <p className="text-3xl font-light text-charcoal" style={{ fontFamily: "var(--font-fraunces)" }}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}

/* ── Activity heatmap ──────────────────────────── */
function ActivityHeatmap({ activityMap }: { activityMap: Record<string, number> }) {
  const weeks: { date: string; count: number }[][] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build 52 weeks × 7 days grid ending today
  const startDay = new Date(today);
  startDay.setDate(startDay.getDate() - (52 * 7 - 1));
  // Align to Sunday
  startDay.setDate(startDay.getDate() - startDay.getDay());

  let week: { date: string; count: number }[] = [];
  const cursor = new Date(startDay);
  while (cursor <= today) {
    const d = cursor.toISOString().split("T")[0];
    week.push({ date: d, count: activityMap[d] ?? 0 });
    if (week.length === 7) { weeks.push(week); week = []; }
    cursor.setDate(cursor.getDate() + 1);
  }
  if (week.length) weeks.push(week);

  function cellColor(count: number) {
    if (count === 0) return "bg-border";
    if (count === 1) return "bg-accent/30";
    if (count === 2) return "bg-accent/60";
    return "bg-accent";
  }

  const months: string[] = [];
  let lastMonth = -1;
  weeks.forEach((w) => {
    const m = new Date(w[0].date).getMonth();
    if (m !== lastMonth) {
      months.push(new Date(w[0].date).toLocaleDateString("en-US", { month: "short" }));
      lastMonth = m;
    } else {
      months.push("");
    }
  });

  return (
    <div className="card-md rounded-xl p-6">
      <p className="text-xs text-muted font-mono tracking-wider uppercase mb-4">Activity — Last Year</p>
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex flex-col gap-0.5 min-w-max">
          {/* Month labels */}
          <div className="flex gap-0.5 mb-1 pl-6">
            {months.map((m, i) => (
              <div key={i} className="w-3 text-[9px] text-muted font-mono">{m}</div>
            ))}
          </div>
          {/* Day rows */}
          {["S","M","T","W","T","F","S"].map((day, di) => (
            <div key={di} className="flex items-center gap-0.5">
              <span className="w-5 text-[9px] text-muted font-mono text-right pr-1 shrink-0">
                {di % 2 === 1 ? day : ""}
              </span>
              {weeks.map((w, wi) => {
                const cell = w[di];
                if (!cell) return <div key={wi} className="w-3 h-3" />;
                return (
                  <div
                    key={wi}
                    title={`${cell.date}: ${cell.count} session${cell.count !== 1 ? "s" : ""}`}
                    className={`w-3 h-3 rounded-[2px] transition-opacity hover:opacity-70 ${cellColor(cell.count)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-[10px] text-muted">Less</span>
        {[0,1,2,3].map((v) => (
          <div key={v} className={`w-3 h-3 rounded-[2px] ${cellColor(v)}`} />
        ))}
        <span className="text-[10px] text-muted">More</span>
      </div>
    </div>
  );
}

/* ── Custom tooltip ────────────────────────────── */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: {value: number}[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-md rounded-lg px-3 py-2 text-xs shadow-card-md">
      <p className="text-muted mb-0.5">{label}</p>
      <p className="font-semibold text-charcoal">{payload[0].value}</p>
    </div>
  );
}

/* ── Empty state ───────────────────────────────── */
function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-light border border-accent-mid mb-5">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c49a2a" strokeWidth="1.8">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      </div>
      <h2 className="text-xl font-light text-charcoal mb-2" style={{ fontFamily: "var(--font-fraunces)" }}>
        No data yet
      </h2>
      <p className="text-sm text-muted mb-6">Complete a session to start tracking your progress.</p>
      <Link href="/setup" className="btn-primary">
        Start Your First Session →
      </Link>
    </div>
  );
}

/* ── Page ──────────────────────────────────────── */
export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const history = loadHistory();
    setAnalytics(buildAnalytics(history));
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <>
        <Header />
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-20 flex justify-center">
          <span className="text-2xl animate-spin-slow inline-block">✦</span>
        </div>
      </>
    );
  }

  if (!analytics || analytics.totalSessions === 0) {
    return (
      <>
        <Header />
        <main className="max-w-5xl mx-auto px-5 sm:px-8 py-12">
          <EmptyState />
        </main>
      </>
    );
  }

  const { totalSessions, avgScore, avgTimeSecs, bestScore, scoreOverTime, scoreByProfession, scoreByType, activityMap, fastestAnswer, slowestAnswer } = analytics;

  const fmtTime = (s: number) => s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">

        {/* ── Page header ─────────────────────── */}
        <div className="mb-10">
          <p className="label mb-1">Your Progress</p>
          <h1 className="text-3xl sm:text-4xl font-light text-charcoal" style={{ fontFamily: "var(--font-fraunces)" }}>
            Analytics
          </h1>
        </div>

        {/* ── Stats row ────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Stat label="Sessions" value={totalSessions} />
          <Stat label="Avg Score" value={`${avgScore}/100`} />
          <Stat label="Avg Time / Q" value={avgTimeSecs > 0 ? fmtTime(avgTimeSecs) : "—"} sub="per question" />
          <Stat label="Best Score" value={`${bestScore}/100`} />
        </div>

        {/* ── Score over time ──────────────────── */}
        {scoreOverTime.length > 1 && (
          <div className="card-md rounded-xl p-6 mb-6">
            <p className="text-xs text-muted font-mono tracking-wider uppercase mb-5">Score Over Time</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={scoreOverTime} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--c-muted)", fontFamily: "var(--font-mono)" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--c-muted)", fontFamily: "var(--font-mono)" }} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone" dataKey="score"
                  stroke="#c49a2a" strokeWidth={2.5}
                  dot={{ fill: "#c49a2a", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Two-column: by profession + by type ─ */}
        <div className="grid sm:grid-cols-2 gap-6 mb-6">

          {/* By profession */}
          {scoreByProfession.length > 0 && (
            <div className="card-md rounded-xl p-6">
              <p className="text-xs text-muted font-mono tracking-wider uppercase mb-5">Avg Score by Role</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={scoreByProfession}
                  layout="vertical"
                  margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--c-muted)", fontFamily: "var(--font-mono)" }} />
                  <YAxis
                    type="category" dataKey="profession" width={110}
                    tick={{ fontSize: 10, fill: "var(--c-muted)", fontFamily: "var(--font-jakarta)" }}
                    tickFormatter={(v: string) => v.length > 16 ? v.slice(0, 14) + "…" : v}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="score" fill="#c49a2a" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* By interview type */}
          {scoreByType.length > 0 && (
            <div className="card-md rounded-xl p-6">
              <p className="text-xs text-muted font-mono tracking-wider uppercase mb-5">Avg Score by Type</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={scoreByType} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                  <XAxis dataKey="type" tick={{ fontSize: 11, fill: "var(--c-muted)", fontFamily: "var(--font-mono)" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--c-muted)", fontFamily: "var(--font-mono)" }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="score" fill="#c49a2a" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>

              {/* Fastest / slowest */}
              {(fastestAnswer || slowestAnswer) && (
                <div className="mt-5 pt-5 border-t border-border space-y-3">
                  {fastestAnswer && (
                    <div>
                      <p className="text-[10px] font-mono text-muted tracking-wider uppercase mb-1">⚡ Fastest Answer</p>
                      <p className="text-xs text-charcoal line-clamp-2">{fastestAnswer.question}</p>
                      <p className="text-xs text-accent font-mono mt-0.5">{fmtTime(fastestAnswer.secs)}</p>
                    </div>
                  )}
                  {slowestAnswer && (
                    <div>
                      <p className="text-[10px] font-mono text-muted tracking-wider uppercase mb-1">🐢 Slowest Answer</p>
                      <p className="text-xs text-charcoal line-clamp-2">{slowestAnswer.question}</p>
                      <p className="text-xs text-accent font-mono mt-0.5">{fmtTime(slowestAnswer.secs)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Activity heatmap ─────────────────── */}
        <ActivityHeatmap activityMap={activityMap} />

        {/* ── CTA ──────────────────────────────── */}
        <div className="text-center mt-10">
          <Link href="/setup" className="btn-primary !px-10 !py-3">
            Start a New Session →
          </Link>
        </div>

      </main>
    </>
  );
}
