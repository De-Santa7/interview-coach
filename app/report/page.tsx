"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageWrapper from "@/components/PageWrapper";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import { useSession } from "@/lib/session-context";
import { FullReport } from "@/lib/types";
import { saveToHistory } from "@/lib/history";
import ReportView from "@/components/ReportView";

/* ── Skeleton loader ───────────────────────────── */
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-md ${className}`} />;
}

export default function ReportPage() {
  const router = useRouter();
  const { state, setReport, reset } = useSession();
  const { config, questions, answers, challenge, challengeSubmission, report } = state;

  const [streaming, setStreaming] = useState(false);
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<FullReport | null>(report || null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!config || questions.length === 0) router.replace("/setup");
  }, [config, questions, router]);

  useEffect(() => {
    if (!config || questions.length === 0 || parsed || hasFetched.current) return;
    hasFetched.current = true;

    async function generate() {
      setStreaming(true);
      setRawText("");
      setError("");
      try {
        const res = await fetch("/api/generate-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profession: config!.profession,
            level: config!.level,
            interviewType: config!.interviewType,
            questions,
            answers,
            challenge: config!.includeChallenge ? challenge : null,
            challengeSubmission: config!.includeChallenge ? challengeSubmission : null,
          }),
        });
        if (!res.ok || !res.body) throw new Error("Stream failed");
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += dec.decode(value, { stream: true });
          setRawText(acc);
        }
        const json = acc.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
        const p = JSON.parse(json) as FullReport;
        setParsed(p);
        setReport(p);
        saveToHistory({
          id: Date.now().toString(),
          timestamp: Date.now(),
          config: config!,
          report: p,
          questions,
          answers,
          challenge: challenge ?? null,
          challengeSubmission,
        });
      } catch {
        setError("Failed to generate report. Check your API key and try again.");
      } finally {
        setStreaming(false);
      }
    }
    generate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function copyReport() {
    if (!parsed || !config) return;
    const lines = [
      `INTERVIEW REPORT — ${config.level} ${config.profession}`,
      "=".repeat(50),
      "",
      `VERDICT: ${parsed.verdict}`,
      `OVERALL SCORE: ${parsed.overallScore}/100`,
      "",
      `RECOMMENDATION: ${parsed.recommendation}`,
      "",
      "STRENGTHS:",
      ...parsed.strengths.map((s) => `  • ${s}`),
      "",
      "AREAS TO IMPROVE:",
      ...parsed.improvements.map((i) => `  • ${i}`),
      "",
      "=".repeat(50),
      "QUESTION BREAKDOWN",
      "=".repeat(50),
      ...parsed.questions.flatMap((q, i) => [
        "",
        `Q${i + 1}: ${q.question}`,
        `Score: ${q.score}/10`,
        `Your Answer: ${q.answer}`,
        `Strengths: ${q.strengths.join(", ")}`,
        `Gaps: ${q.gaps.join(", ")}`,
        `Ideal: ${q.idealAnswer}`,
      ]),
    ];
    if (parsed.challenge) {
      lines.push("", "=".repeat(50), "PRACTICAL CHALLENGE", "=".repeat(50),
        `Score: ${parsed.challenge.score}/10`,
        `Feedback: ${parsed.challenge.feedback}`,
        `Ideal: ${parsed.challenge.idealSubmission}`
      );
    }
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!config) return null;

  /* ── Loading state ─────────────────────────────── */
  if (streaming || (!parsed && !error)) {
    return (
      <PageWrapper>
        <Header />
        <main className="max-w-3xl mx-auto px-5 sm:px-8 py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent-light border border-accent-mid mb-6">
              <span className="text-2xl animate-spin-slow inline-block">✦</span>
            </div>
            <h1
              className="text-3xl font-light text-charcoal mb-3"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Evaluating your session...
            </h1>
            <p className="text-body text-sm">
              Claude is reviewing your answers and building a full hiring assessment.
            </p>
          </div>

          {/* Streaming preview */}
          {rawText ? (
            <div className="card rounded-xl p-5 font-mono text-xs text-muted leading-relaxed max-h-44 overflow-hidden relative">
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-b-xl" />
              <pre className="whitespace-pre-wrap">{rawText}</pre>
            </div>
          ) : (
            <div className="space-y-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 mt-10">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-accent inline-block"
                style={{ animation: `bounce-dot 1.4s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
        </main>
      </PageWrapper>
    );
  }

  /* ── Error state ────────────────────────────────── */
  if (error) {
    return (
      <PageWrapper>
        <Header />
        <main className="max-w-3xl mx-auto px-5 sm:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2.5 bg-danger-light border border-danger/30 text-danger rounded-md px-5 py-3 text-sm mb-6">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
          <br />
          <button
            onClick={() => { hasFetched.current = false; setParsed(null); setError(""); }}
            className="btn-primary"
          >
            Try again
          </button>
        </main>
      </PageWrapper>
    );
  }

  const r = parsed!;

  return (
    <PageWrapper>
      <Header />
      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <div className="mb-8">
          <BackButton href="/" label="Home" />
        </div>

        <ReportView config={config} report={r} />

        {/* ── Action bar ───────────────────────── */}
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
            onClick={() => reset()}
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
