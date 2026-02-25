"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import PageWrapper from "@/components/PageWrapper";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import { useSession } from "@/lib/session-context";

/* ── Web Speech API types ──────────────────────── */
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
    gtag?: (...args: unknown[]) => void;
  }
}

/* ── Timer helpers ─────────────────────────────── */
function getQuestionDuration(interviewType: string, questionCategory?: string): number {
  if (interviewType === "Technical") return 3 * 60;
  if (interviewType === "Behavioral") return 2 * 60;
  // Mixed — use the question's own category
  if (questionCategory === "Technical") return 3 * 60;
  return 2 * 60;
}

/* ── Countdown Ring ────────────────────────────── */
function CountdownRing({ timeLeft, total }: { timeLeft: number; total: number }) {
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const pct = total > 0 ? timeLeft / total : 0;
  const offset = circ * (1 - pct);

  const isRed = timeLeft <= 10;
  const isAmber = timeLeft <= 30 && !isRed;
  const strokeColor = isRed ? "#e05252" : isAmber ? "#f97316" : "#c49a2a";
  const pulseClass = isRed ? "timer-pulse-red" : isAmber ? "timer-pulse-amber" : "";

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const label = `${mins}:${String(secs).padStart(2, "0")}`;

  return (
    <div className={`relative w-16 h-16 shrink-0 ${pulseClass}`}>
      <svg width="64" height="64" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--ring-track)" strokeWidth="4" />
        <circle
          cx="32" cy="32" r={radius} fill="none"
          stroke={strokeColor} strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-mono text-[10px] font-semibold tabular-nums"
          style={{ color: strokeColor }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

/* ── Webcam feed ───────────────────────────────── */
function WebcamFeed() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [denied, setDenied] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: { width: 320, height: 240 }, audio: false })
      .then((stream) => {
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      })
      .catch(() => { if (active) setDenied(true); });
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (denied) {
    return (
      <div className="fixed top-16 right-3 z-40 hidden sm:block">
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[10px] rounded-lg px-3 py-2 max-w-[180px] leading-snug">
          📷 Camera access recommended to simulate a real interview environment
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-16 right-3 z-40 hidden sm:block">
      <div className="relative w-40 h-[120px] rounded-xl overflow-hidden border-2 border-border shadow-card-md bg-black">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}
        />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <span className="text-[10px] text-white/40 font-mono">connecting…</span>
          </div>
        )}
        {/* REC badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 rounded px-1.5 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="font-mono text-[9px] text-white tracking-wider">REC</span>
        </div>
      </div>
      <p className="text-center font-mono text-[9px] text-muted mt-1 tracking-wide">
        You are being monitored
      </p>
    </div>
  );
}

/* ── Page ──────────────────────────────────────── */
export default function InterviewPage() {
  const router = useRouter();
  const { state, setAnswer } = useSession();
  const { config, questions, answers, challenge } = state;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [answerText, setAnswerText] = useState("");
  const [inputMode, setInputMode] = useState<"type" | "voice">("type");
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const startedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (typeof window !== "undefined") {
      setVoiceSupported(!!(window.SpeechRecognition || window.webkitSpeechRecognition));
    }
  }, []);

  useEffect(() => {
    if (!config || questions.length === 0) router.replace("/setup");
  }, [config, questions, router]);

  // Load saved answer on question change
  useEffect(() => {
    if (!questions[currentIndex]) return;
    const saved = answers.find((a) => a.questionId === questions[currentIndex].id);
    setAnswerText(saved?.text || "");
  }, [currentIndex, questions, answers]);

  // Reset timer on question change
  useEffect(() => {
    if (!config || !questions[currentIndex]) return;
    const duration = getQuestionDuration(config.interviewType, questions[currentIndex].category);
    setTotalTime(duration);
    setTimeLeft(duration);
    startedAtRef.current = Date.now();
  }, [currentIndex, questions, config]);

  // Countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          // Auto-submit
          setTimeout(() => saveAndNext(), 0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]); // re-run when question changes

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    let final = answerText;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += (final ? " " : "") + r[0].transcript;
        else interim += r[0].transcript;
      }
      setAnswerText(final + (interim ? " " + interim : ""));
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
    // Track voice usage
    window.gtag?.("event", "voice_used", { question_index: currentIndex });
  }, [answerText, currentIndex]);

  function saveAndNext() {
    stopListening();
    const timeTaken = Math.round((Date.now() - startedAtRef.current) / 1000);
    if (questions[currentIndex]) {
      setAnswer({ questionId: questions[currentIndex].id, text: answerText, timeTaken });
      // Track question answered
      window.gtag?.("event", "question_answered", { question_index: currentIndex });
    }
    const isLast = currentIndex === questions.length - 1;
    if (isLast) {
      router.push(config?.includeChallenge && challenge ? "/challenge" : "/report");
    } else {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    }
  }

  function saveAndPrev() {
    stopListening();
    const timeTaken = Math.round((Date.now() - startedAtRef.current) / 1000);
    if (questions[currentIndex]) {
      setAnswer({ questionId: questions[currentIndex].id, text: answerText, timeTaken });
    }
    setDirection(-1);
    setCurrentIndex((i) => i - 1);
  }

  if (!config || questions.length === 0) return null;

  const q = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const wordCount = answerText.split(/\s+/).filter(Boolean).length;
  const progressPct = ((currentIndex + 1) / questions.length) * 100;

  return (
    <PageWrapper>
      <Header />

      {/* Webcam — fixed top-right */}
      <WebcamFeed />

      {/* ── Progress bar ───────────────────────── */}
      <div className="h-0.5 bg-border">
        <div
          className="h-0.5 bg-accent transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div className="mb-6">
          <BackButton href="/setup" label="Setup" />
        </div>

        {/* ── Header row ──────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xs text-muted tracking-widest uppercase">
              {config.profession}
            </span>
            <span className="text-border">·</span>
            <span className="font-mono text-2xs text-muted tracking-widest uppercase">
              {config.level}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <CountdownRing timeLeft={timeLeft} total={totalTime} />
            <span className="font-mono text-2xs text-muted">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>
        </div>

        {/* ── Question card ──────────────────── */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={q.id}
            className="card-md rounded-xl p-8 sm:p-10 mb-6"
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {q.category && (
              <span className="inline-flex items-center gap-1.5 font-mono text-2xs tracking-widest uppercase text-accent bg-accent-light border border-accent-mid px-2.5 py-1 rounded-full mb-5">
                {q.category === "Technical" ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                  </svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  </svg>
                )}
                {q.category}
              </span>
            )}
            <p
              className="text-2xl sm:text-[1.6rem] font-light text-charcoal leading-relaxed"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              {q.text}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* ── Answer box ─────────────────────── */}
        <div className="card rounded-xl overflow-hidden mb-6">
          {/* Segmented control */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-bg">
            <div className="seg-control">
              <button
                type="button"
                className={`seg-btn ${inputMode === "type" ? "active" : ""}`}
                onClick={() => { stopListening(); setInputMode("type"); }}
              >
                ✏️ Type
              </button>
              {voiceSupported && (
                <button
                  type="button"
                  className={`seg-btn flex items-center gap-1.5 ${inputMode === "voice" ? "active" : ""}`}
                  onClick={() => { setInputMode("voice"); if (isListening) stopListening(); }}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      isListening ? "bg-danger" : "bg-muted"
                    }`}
                  />
                  Voice
                </button>
              )}
            </div>
            <span className="font-mono text-2xs text-muted">
              {wordCount > 0 ? `${wordCount} words` : ""}
            </span>
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder={
                inputMode === "voice"
                  ? "Tap the mic to start speaking — your words will appear here..."
                  : "Type your answer here. Use specific examples and concrete details from your experience."
              }
              rows={9}
              className="w-full bg-surface text-charcoal text-sm leading-relaxed p-6 focus:outline-none placeholder:text-muted/50 resize-none font-sans"
            />

            {/* Voice button overlay */}
            {inputMode === "voice" && (
              <div className="absolute bottom-5 right-5">
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isListening
                      ? "bg-danger shadow-lg"
                      : "bg-accent hover:bg-accent-hover shadow-card"
                  } relative`}
                  aria-label={isListening ? "Stop recording" : "Start recording"}
                >
                  {isListening && (
                    <>
                      <span className="voice-ring" />
                      <span className="voice-ring" style={{ animationDelay: "0.35s" }} />
                    </>
                  )}
                  <span className="relative z-10 text-white">
                    {isListening ? (
                      <span className="w-3.5 h-3.5 bg-white rounded-sm block" />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                      </svg>
                    )}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Clear row */}
          {answerText && (
            <div className="px-5 py-2 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setAnswerText("")}
                className="text-xs text-muted hover:text-danger transition-colors"
              >
                Clear answer
              </button>
            </div>
          )}
        </div>

        {/* ── Navigation ─────────────────────── */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={saveAndPrev}
            disabled={currentIndex === 0}
            className="btn-secondary !py-2.5 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Previous
          </button>

          <button
            type="button"
            onClick={saveAndNext}
            className="btn-primary flex items-center gap-2 !px-8 !py-3"
          >
            {isLast
              ? config.includeChallenge && challenge
                ? "Go to Challenge"
                : "View Report"
              : "Next Question"}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        {!answerText.trim() && (
          <p className="text-center text-xs text-muted mt-5">
            You can proceed without answering — Claude will note the skipped question.
          </p>
        )}
      </main>
    </PageWrapper>
  );
}
