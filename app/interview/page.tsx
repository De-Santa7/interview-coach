"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import PageWrapper from "@/components/PageWrapper";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import { useSession } from "@/lib/session-context";
import { createClient } from "@/lib/supabase/client";
import { IntegrityData, IntegrityEvent } from "@/lib/types";

/* ── Speech Recognition types ──────────────────── */
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

/* ── Types ─────────────────────────────────────── */
type CameraState = "idle" | "requesting" | "granted" | "denied";
type DistractionLevel = 0 | 1 | 2 | 3; // 0=clean 1=warn 2=final-warn 3=critical

const INTEGRITY_KEY = "interview-coach-integrity";

/* ── Timer helper ───────────────────────────────── */
function getQuestionDuration(interviewType: string, questionCategory?: string): number {
  if (interviewType === "Technical") return 3 * 60;
  if (interviewType === "Behavioral") return 2 * 60;
  return questionCategory === "Technical" ? 3 * 60 : 2 * 60;
}

/* ── Countdown Ring (gradient SVG) ─────────────── */
function CountdownRing({ timeLeft, total }: { timeLeft: number; total: number }) {
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const pct = total > 0 ? timeLeft / total : 0;
  const offset = circ * (1 - pct);
  const isRed = timeLeft <= 10;
  const isAmber = timeLeft <= 30 && !isRed;
  const gradId = isRed ? "ring-red" : isAmber ? "ring-amber" : "ring-gold";
  const strokeColor = isRed ? "#ef476f" : isAmber ? "#ffd166" : "#e8b923";
  const pulseClass = isRed ? "timer-pulse-red" : isAmber ? "timer-pulse-amber" : "";
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className={`relative w-16 h-16 shrink-0 ${pulseClass}`}>
      <svg width="64" height="64" style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id={`${gradId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={strokeColor} />
            <stop offset="100%" stopColor={isRed ? "#c0392b" : isAmber ? "#e8b923" : "#00b4d8"} />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--ring-track)" strokeWidth="4" />
        <circle
          cx="32" cy="32" r={radius} fill="none"
          stroke={`url(#${gradId})`} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-[10px] font-semibold tabular-nums" style={{ color: strokeColor }}>
          {mins}:{String(secs).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}

/* ── Camera Permission Gate ─────────────────────── */
function CameraGate({ state, onRequest }: { state: CameraState; onRequest: () => void }) {
  const router = useRouter();

  if (state === "requesting") {
    return (
      <PageWrapper>
        <Header />
        <main className="max-w-md mx-auto px-5 py-24 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-accent-light border-2 border-accent-mid flex items-center justify-center mb-6 animate-pulse">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#e8b923" strokeWidth="1.5">
              <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </div>
          <h1 className="text-2xl font-light text-charcoal mb-3" style={{ fontFamily: "var(--font-fraunces)" }}>
            Camera access required
          </h1>
          <p className="text-sm text-body leading-relaxed mb-8 max-w-sm">
            InterviewCoach uses your camera to simulate a real interview environment and monitor attention. No video is recorded or stored.
          </p>
          <button onClick={onRequest} className="btn-primary !px-10 !py-3.5 !text-base">
            Enable Camera &amp; Begin →
          </button>
          <button
            onClick={() => router.push("/setup")}
            className="mt-4 text-sm text-muted hover:text-charcoal transition-colors"
          >
            ← Back to setup
          </button>
        </main>
      </PageWrapper>
    );
  }

  // denied
  return (
    <PageWrapper>
      <Header />
      <main className="max-w-md mx-auto px-5 py-24 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-danger-light border-2 border-danger/30 flex items-center justify-center mb-6">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef476f" strokeWidth="1.5">
            <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            <line x1="1" y1="1" x2="23" y2="23" strokeWidth="2"/>
          </svg>
        </div>
        <h1 className="text-2xl font-light text-charcoal mb-3" style={{ fontFamily: "var(--font-fraunces)" }}>
          Camera access denied
        </h1>
        <p className="text-sm text-body leading-relaxed mb-3 max-w-sm">
          Camera permission was blocked. You must allow camera access to take the interview.
        </p>
        <div className="card rounded-lg px-4 py-3 text-xs text-muted text-left mb-8 max-w-sm w-full space-y-1.5">
          <p className="font-semibold text-charcoal text-xs mb-2">How to enable in your browser:</p>
          <p>1. Click the camera icon or lock icon in the address bar</p>
          <p>2. Set Camera to <strong>Allow</strong></p>
          <p>3. Reload this page</p>
        </div>
        <button onClick={onRequest} className="btn-primary !px-10 !py-3.5">
          Try Again
        </button>
        <button
          onClick={() => router.push("/setup")}
          className="mt-4 text-sm text-muted hover:text-charcoal transition-colors"
        >
          ← Back to setup
        </button>
      </main>
    </PageWrapper>
  );
}

/* ── Distraction Warning Overlays ───────────────── */
function DistractionWarning({
  level,
  countdown,
  onDismiss,
  onCancel,
}: {
  level: DistractionLevel;
  countdown: number;
  onDismiss: () => void;
  onCancel: () => void;
}) {
  if (level === 0) return null;

  if (level === 1) {
    return (
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
        <div className="flex items-center gap-3 bg-warning text-charcoal px-5 py-3 rounded-xl shadow-lg text-sm font-medium max-w-sm border border-warning/60">
          <span className="text-lg shrink-0">👀</span>
          <span>No face detected — please look at the screen</span>
        </div>
      </div>
    );
  }

  if (level === 2) {
    return (
      <div className="fixed top-14 left-0 right-0 z-50 animate-fade-in">
        <div className="bg-danger text-white px-5 py-3 flex items-center gap-3">
          <span className="text-xl shrink-0">⚠️</span>
          <span className="text-sm font-medium">
            Second warning — face not detected again. One more and your session will be submitted.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-5 animate-fade-in">
      <div className="bg-danger rounded-2xl p-8 text-white text-center max-w-sm w-full shadow-2xl">
        <div className="text-5xl mb-4">🚨</div>
        <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: "var(--font-fraunces)" }}>
          Final Warning
        </h2>
        <p className="text-white/80 text-sm mb-6 leading-relaxed">
          Face not detected repeatedly. Your session will be submitted automatically.
        </p>
        <div className="text-5xl font-mono font-bold mb-6 tabular-nums">
          {countdown}
        </div>
        <button
          onClick={onCancel}
          className="w-full bg-white text-danger font-semibold py-3 rounded-lg hover:bg-white/90 transition-colors text-sm"
        >
          I&apos;m here — cancel
        </button>
      </div>
    </div>
  );
}

/* ── Webcam Feed with face detection status ─────── */
function WebcamFeed({
  videoRef,
  faceDetected,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  faceDetected: boolean;
}) {
  return (
    <div className="fixed top-16 right-3 z-40 hidden sm:block">
      <div
        className={`relative w-44 h-[110px] rounded-xl overflow-hidden border-2 shadow-card-md bg-black transition-all duration-500 ${
          faceDetected ? "webcam-ok" : "webcam-warn"
        }`}
      >
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          autoPlay playsInline muted
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 rounded px-1.5 py-0.5">
          <span className={`w-1.5 h-1.5 rounded-full ${faceDetected ? "bg-success" : "bg-danger animate-pulse"}`} />
          <span className="font-mono text-[9px] text-white tracking-wider">
            {faceDetected ? "LIVE" : "NO FACE"}
          </span>
        </div>
      </div>
      <p className={`text-center font-mono text-[9px] mt-1.5 tracking-wide transition-colors ${
        faceDetected ? "text-success" : "text-danger"
      }`}>
        {faceDetected ? "👁 Monitoring active" : "⚠️ Look at screen"}
      </p>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────── */
export default function InterviewPage() {
  const router = useRouter();
  const { state, setAnswer, hydrated } = useSession();
  const { config, questions, answers, challenge } = state;

  /* Camera + detection */
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [distractionLevel, setDistractionLevel] = useState<DistractionLevel>(0);
  const [logoutCountdown, setLogoutCountdown] = useState(10);
  const [faceDetected, setFaceDetected] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const distractionCountRef = useRef(0);
  const consecutiveRef = useRef(0);

  /* Integrity tracking */
  const integrityEventsRef = useRef<IntegrityEvent[]>([]);
  const warningCountRef = useRef(0);
  const faceAbsenceStartRef = useRef<number | null>(null);
  const totalFaceAbsenceMsRef = useRef(0);

  /* Interview state */
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [answerText, setAnswerText] = useState("");
  const [inputMode, setInputMode] = useState<"type" | "voice">("type");
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  /* Timer */
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const startedAtRef = useRef<number>(Date.now());

  /* Guards */
  useEffect(() => {
    if (typeof window !== "undefined") {
      setVoiceSupported(!!(window.SpeechRecognition || window.webkitSpeechRecognition));
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!config || questions.length === 0) router.replace("/setup");
  }, [hydrated, config, questions, router]);

  /* ── Camera permission request ─────────────────── */
  function requestCamera() {
    setCameraState("requesting");
    navigator.mediaDevices
      .getUserMedia({ video: { width: 320, height: 240, facingMode: "user" }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        setCameraState("granted");
      })
      .catch(() => setCameraState("denied"));
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (detectionRef.current) clearInterval(detectionRef.current);
      if (logoutTimerRef.current) clearInterval(logoutTimerRef.current);
      // Save integrity data before unmounting
      saveIntegrityData();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (cameraState !== "granted") return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (video && stream) {
      video.srcObject = stream;
      video.play().catch(() => {});
    }
    // Start canvas-based detection immediately — no CDN needed
    detectionRef.current = setInterval(() => analyzeFrameRef.current(), 1000);
    return () => {
      if (detectionRef.current) clearInterval(detectionRef.current);
    };
  }, [cameraState]);

  /* ── Integrity data persistence ─────────────────── */
  function saveIntegrityData() {
    try {
      // Finalize any open absence window
      let totalMs = totalFaceAbsenceMsRef.current;
      if (faceAbsenceStartRef.current !== null) {
        totalMs += Date.now() - faceAbsenceStartRef.current;
      }
      const wc = warningCountRef.current;
      // Score: 100 - (warnings * 10) - (totalMs / 1000 / 5)
      // Each warning costs 10 pts, each 5s of absence costs 1 pt
      const deduction = wc * 10 + Math.floor(totalMs / 5000);
      const score = Math.max(0, 100 - deduction);
      const verdict =
        score >= 85 ? "High Integrity" :
        score >= 60 ? "Medium Integrity" : "Low Integrity";

      const data: IntegrityData = {
        events: integrityEventsRef.current,
        warningCount: wc,
        totalFaceAbsenceMs: totalMs,
        score,
        verdict,
      };
      localStorage.setItem(INTEGRITY_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
  }

  /* ── Distraction logic ─────────────────────────── */
  const triggerDistraction = useCallback(() => {
    consecutiveRef.current = 0;
    distractionCountRef.current += 1;
    warningCountRef.current += 1;
    const count = distractionCountRef.current;

    if (count === 1) {
      setDistractionLevel(1);
      setTimeout(() => setDistractionLevel((prev) => (prev === 1 ? 0 : prev)), 4500);
    } else if (count === 2) {
      setDistractionLevel(2);
      setTimeout(() => setDistractionLevel((prev) => (prev === 2 ? 0 : prev)), 4500);
    } else {
      setDistractionLevel(3);
      startFinalCountdown();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Canvas pixel analysis — no CDN, works instantly ── */
  const analyzeFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.paused) return;

    // Lazily create the offscreen canvas
    if (!analysisCanvasRef.current) {
      analysisCanvasRef.current = document.createElement("canvas");
    }
    const canvas = analysisCanvasRef.current;
    const W = 64, H = 48;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    try {
      ctx.drawImage(video, 0, 0, W, H);
      const { data } = ctx.getImageData(0, 0, W, H);
      const n = W * H;

      // Compute average luminance
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        sum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      }
      const avg = sum / n;

      // Compute variance (low variance = uniform coverage e.g. fingers/palm)
      let variance = 0;
      for (let i = 0; i < data.length; i += 4) {
        const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        variance += (lum - avg) * (lum - avg);
      }
      variance /= n;

      // Blocked if very dark OR uniformly covered (hand/object)
      const isBlocked = avg < 30 || variance < 400;

      // Skin-tone face presence check in the center 50% of the frame
      // Uses simplified Kovac skin detection: R > G, R > B, warm hue
      let skinPixels = 0;
      const x0 = Math.floor(W * 0.2), x1 = Math.floor(W * 0.8);
      const y0 = Math.floor(H * 0.1), y1 = Math.floor(H * 0.9);
      const centerTotal = (x1 - x0) * (y1 - y0);
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * W + x) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          if (r > 80 && g > 30 && b > 15 && r > g && r > b && (r - Math.min(g, b)) > 20) {
            skinPixels++;
          }
        }
      }
      const skinRatio = skinPixels / centerTotal;
      // No face: camera not blocked but skin tone < 4% of center region
      const noFace = !isBlocked && skinRatio < 0.04;

      const absent = isBlocked || noFace;

      if (absent) {
        setFaceDetected(false);
        consecutiveRef.current += 1;
        if (faceAbsenceStartRef.current === null) {
          faceAbsenceStartRef.current = Date.now();
          const evtType = isBlocked ? "face_left" : "gaze_away";
          integrityEventsRef.current.push({ timestamp: Date.now(), type: evtType });
        }
        if (consecutiveRef.current >= 2) triggerDistraction();
      } else {
        setFaceDetected(true);
        consecutiveRef.current = 0;
        if (faceAbsenceStartRef.current !== null) {
          totalFaceAbsenceMsRef.current += Date.now() - faceAbsenceStartRef.current;
          faceAbsenceStartRef.current = null;
          integrityEventsRef.current.push({ timestamp: Date.now(), type: "face_returned" });
        }
      }
    } catch {
      // skip frame silently
    }
  }, [triggerDistraction]);

  const analyzeFrameRef = useRef(analyzeFrame);
  useEffect(() => { analyzeFrameRef.current = analyzeFrame; }, [analyzeFrame]);

  /* ── Final-warning countdown → redirect to report ── */
  function startFinalCountdown() {
    if (logoutTimerRef.current) return;
    let n = 10;
    setLogoutCountdown(n);
    logoutTimerRef.current = setInterval(() => {
      n -= 1;
      setLogoutCountdown(n);
      if (n <= 0) {
        clearInterval(logoutTimerRef.current!);
        logoutTimerRef.current = null;
        endSessionToReport();
      }
    }, 1000);
  }

  function endSessionToReport() {
    saveIntegrityData();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (detectionRef.current) clearInterval(detectionRef.current);
    // Save current answer before leaving
    if (questions[currentIndex]) {
      const timeTaken = Math.round((Date.now() - startedAtRef.current) / 1000);
      setAnswer({ questionId: questions[currentIndex].id, text: answerText, timeTaken });
    }
    router.push("/report");
  }

  function cancelFinalCountdown() {
    if (logoutTimerRef.current) {
      clearInterval(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    setLogoutCountdown(10);
    setDistractionLevel(0);
  }

  /* ── Load saved answer when question changes ───── */
  useEffect(() => {
    if (!questions[currentIndex]) return;
    const saved = answers.find((a) => a.questionId === questions[currentIndex].id);
    setAnswerText(saved?.text || "");
  }, [currentIndex, questions, answers]);

  /* ── Timer — starts only after camera granted ──── */
  useEffect(() => {
    if (cameraState !== "granted" || !config || !questions[currentIndex]) return;

    const duration = getQuestionDuration(config.interviewType, questions[currentIndex].category);
    setTotalTime(duration);
    startedAtRef.current = Date.now();

    let t = duration;
    setTimeLeft(t);

    const id = setInterval(() => {
      t -= 1;
      setTimeLeft(t);
      if (t <= 0) {
        clearInterval(id);
        setTimedOut(true);
      }
    }, 1000);

    return () => clearInterval(id);
  }, [currentIndex, cameraState, questions, config]);

  /* ── Handle timer auto-submit ───────────────────── */
  const saveAndNextRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (!timedOut) return;
    setTimedOut(false);
    saveAndNextRef.current();
  }, [timedOut]);

  /* ── Answer controls ────────────────────────────── */
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
    window.gtag?.("event", "voice_used", { question_index: currentIndex });
  }, [answerText, currentIndex]);

  function saveAndNext() {
    stopListening();
    const timeTaken = Math.round((Date.now() - startedAtRef.current) / 1000);
    if (questions[currentIndex]) {
      setAnswer({ questionId: questions[currentIndex].id, text: answerText, timeTaken });
      window.gtag?.("event", "question_answered", { question_index: currentIndex });
    }
    const isLast = currentIndex === questions.length - 1;
    if (isLast) {
      saveIntegrityData();
      router.push(config?.includeChallenge && challenge ? "/challenge" : "/report");
    } else {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    }
  }

  useEffect(() => { saveAndNextRef.current = saveAndNext; });

  function saveAndPrev() {
    stopListening();
    const timeTaken = Math.round((Date.now() - startedAtRef.current) / 1000);
    if (questions[currentIndex]) {
      setAnswer({ questionId: questions[currentIndex].id, text: answerText, timeTaken });
    }
    setDirection(-1);
    setCurrentIndex((i) => i - 1);
  }

  /* ── Camera gate ─────────────────────────────── */
  if (cameraState !== "granted") {
    return <CameraGate state={cameraState} onRequest={requestCamera} />;
  }

  if (!config || questions.length === 0) return null;

  const q = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const wordCount = answerText.split(/\s+/).filter(Boolean).length;
  const progressPct = ((currentIndex + 1) / questions.length) * 100;

  return (
    <PageWrapper>
      <Header />

      {/* Distraction overlays */}
      <DistractionWarning
        level={distractionLevel}
        countdown={logoutCountdown}
        onDismiss={() => setDistractionLevel(0)}
        onCancel={cancelFinalCountdown}
      />

      {/* Webcam feed with face detection status */}
      <WebcamFeed videoRef={videoRef} faceDetected={faceDetected} />

      {/* Gradient progress bar */}
      <div className="h-1 bg-border">
        <div
          className="h-1 progress-gradient transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div className="mb-6">
          <BackButton href="/setup" label="Setup" />
        </div>

        {/* Header row */}
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

        {/* Question card with gradient top border */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={q.id}
            className="rounded-xl p-8 sm:p-10 mb-6 relative overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #ffffff, #f8f6f0)",
              boxShadow: "var(--shadow-card-md)",
              border: "1px solid var(--c-border)",
            }}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Gradient top accent bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
              style={{ background: "linear-gradient(90deg, #e8b923, #00b4d8)" }}
            />

            {q.category && (
              <span className="inline-flex items-center gap-1.5 font-mono text-2xs tracking-widest uppercase text-accent-hover bg-accent-light border border-accent-mid px-2.5 py-1 rounded-full mb-5">
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

        {/* Answer box */}
        <div className="card rounded-xl overflow-hidden mb-6">
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
                  <span className={`w-1.5 h-1.5 rounded-full transition-colors ${isListening ? "bg-danger" : "bg-muted"}`} />
                  Voice
                </button>
              )}
            </div>
            <span className="font-mono text-2xs text-muted">
              {wordCount > 0 ? `${wordCount} words` : ""}
            </span>
          </div>

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
            {inputMode === "voice" && (
              <div className="absolute bottom-5 right-5">
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isListening ? "bg-danger shadow-lg" : "bg-accent hover:bg-accent-hover shadow-card"
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
                      <span className="flex items-end gap-0.5 h-5">
                        <span className="wave-bar" />
                        <span className="wave-bar" />
                        <span className="wave-bar" />
                        <span className="wave-bar" />
                        <span className="wave-bar" />
                        <span className="wave-bar" />
                      </span>
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

        {/* Navigation */}
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
              ? config.includeChallenge && challenge ? "Go to Challenge" : "View Report"
              : "Next Question"}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        {!answerText.trim() && (
          <p className="text-center text-xs text-muted mt-5">
            You can proceed without answering — the AI will note the skipped question.
          </p>
        )}
      </main>
    </PageWrapper>
  );
}
