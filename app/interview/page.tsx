"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import PageWrapper from "@/components/PageWrapper";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import { useSession } from "@/lib/session-context";
import { createClient } from "@/lib/supabase/client";

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
type CameraState = "requesting" | "granted" | "denied";
type DistractionLevel = 0 | 1 | 2 | 3; // 0=clean 1=warn 2=final-warn 3=critical
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FaceApiModule = any;

/* ── Timer helper ───────────────────────────────── */
function getQuestionDuration(interviewType: string, questionCategory?: string): number {
  if (interviewType === "Technical") return 3 * 60;
  if (interviewType === "Behavioral") return 2 * 60;
  return questionCategory === "Technical" ? 3 * 60 : 2 * 60;
}

/* ── Countdown Ring ─────────────────────────────── */
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

  return (
    <div className={`relative w-16 h-16 shrink-0 ${pulseClass}`}>
      <svg width="64" height="64" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--ring-track)" strokeWidth="4" />
        <circle
          cx="32" cy="32" r={radius} fill="none"
          stroke={strokeColor} strokeWidth="4" strokeLinecap="round"
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
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#c49a2a" strokeWidth="1.5">
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
            Enable Camera & Begin →
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
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#e05252" strokeWidth="1.5">
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

  // Level 1 — toast
  if (level === 1) {
    return (
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
        <div className="flex items-center gap-3 bg-amber-500 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium max-w-sm">
          <span className="text-lg shrink-0">👀</span>
          <span>Eyes on screen — distraction detected</span>
        </div>
      </div>
    );
  }

  // Level 2 — persistent banner
  if (level === 2) {
    return (
      <div className="fixed top-14 left-0 right-0 z-50 animate-fade-in">
        <div className="bg-orange-500 text-white px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl shrink-0">⚠️</span>
            <span className="text-sm font-medium">
              Second warning — you were caught looking away again. One more and you will be signed out.
            </span>
          </div>
          <button onClick={onDismiss} className="shrink-0 opacity-80 hover:opacity-100 text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Level 3 — critical modal
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-5 animate-fade-in">
      <div className="bg-danger rounded-2xl p-8 text-white text-center max-w-sm w-full shadow-2xl">
        <div className="text-5xl mb-4">🚨</div>
        <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: "var(--font-fraunces)" }}>
          Final Warning
        </h2>
        <p className="text-white/80 text-sm mb-6 leading-relaxed">
          You have been repeatedly detected looking away from the screen. You will be automatically signed out.
        </p>
        <div className="text-5xl font-mono font-bold mb-6 tabular-nums">
          {countdown}
        </div>
        <button
          onClick={onCancel}
          className="w-full bg-white text-danger font-semibold py-3 rounded-lg hover:bg-white/90 transition-colors text-sm"
        >
          I&apos;m paying attention — cancel
        </button>
      </div>
    </div>
  );
}

/* ── Webcam Feed (required, always shown) ───────── */
function WebcamFeed({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement | null> }) {
  return (
    <div className="fixed top-16 right-3 z-40 hidden sm:block">
      <div className="relative w-44 h-[110px] rounded-xl overflow-hidden border-2 border-accent shadow-card-md bg-black">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          autoPlay playsInline muted
          className="w-full h-full object-cover"
        />
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

/* ── Main Page ──────────────────────────────────── */
export default function InterviewPage() {
  const router = useRouter();
  const { state, setAnswer } = useSession();
  const { config, questions, answers, challenge } = state;

  /* Camera + detection */
  const [cameraState, setCameraState] = useState<CameraState>("requesting");
  const [distractionLevel, setDistractionLevel] = useState<DistractionLevel>(0);
  const [logoutCountdown, setLogoutCountdown] = useState(10);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceapiRef = useRef<FaceApiModule>(null);
  const detectionRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const distractionCountRef = useRef(0);
  const consecutiveRef = useRef(0);

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
    if (!config || questions.length === 0) router.replace("/setup");
  }, [config, questions, router]);

  /* ── Camera permission request ─────────────────── */
  function requestCamera() {
    setCameraState("requesting");
    navigator.mediaDevices
      .getUserMedia({ video: { width: 320, height: 240, facingMode: "user" }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraState("granted");
        loadFaceDetection();
      })
      .catch(() => setCameraState("denied"));
  }

  // Auto-request on mount
  useEffect(() => {
    requestCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (detectionRef.current) clearInterval(detectionRef.current);
      if (logoutTimerRef.current) clearInterval(logoutTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Face detection model loading ─────────────── */
  async function loadFaceDetection() {
    try {
      const faceapi = await import("face-api.js");
      const MODEL_URL = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights";
      await Promise.all([
        faceapi.loadTinyFaceDetectorModel(MODEL_URL),
        faceapi.loadFaceLandmarkTinyModel(MODEL_URL),
      ]);
      faceapiRef.current = faceapi;
      detectionRef.current = setInterval(() => analyzeFrameRef.current(), 1500);
    } catch (e) {
      console.warn("Face detection unavailable — proctoring limited to camera feed:", e);
    }
  }

  /* ── Distraction logic ─────────────────────────── */
  const triggerDistraction = useCallback(() => {
    consecutiveRef.current = 0;
    distractionCountRef.current += 1;
    const count = distractionCountRef.current;

    if (count === 1) {
      setDistractionLevel(1);
      setTimeout(() => setDistractionLevel((prev) => (prev === 1 ? 0 : prev)), 5000);
    } else if (count === 2) {
      setDistractionLevel(2);
    } else {
      setDistractionLevel(3);
      startLogoutCountdown();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const analyzeFrame = useCallback(async () => {
    const faceapi = faceapiRef.current;
    const video = videoRef.current;
    if (!faceapi || !video || video.readyState < 2 || video.paused) return;

    try {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
        .withFaceLandmarks(true);

      if (!detection) {
        consecutiveRef.current += 1;
        if (consecutiveRef.current >= 2) triggerDistraction();
        return;
      }

      const landmarks = detection.landmarks;
      const leftEye: { x: number }[] = landmarks.getLeftEye();
      const rightEye: { x: number }[] = landmarks.getRightEye();
      const nose: { x: number }[] = landmarks.getNose();

      const leftEyeX = leftEye.reduce((s, p) => s + p.x, 0) / leftEye.length;
      const rightEyeX = rightEye.reduce((s, p) => s + p.x, 0) / rightEye.length;
      const eyeMidX = (leftEyeX + rightEyeX) / 2;
      const noseCenterX = nose.reduce((s, p) => s + p.x, 0) / nose.length;
      const faceWidth = detection.detection.box.width;
      const offset = Math.abs(noseCenterX - eyeMidX) / faceWidth;

      if (offset > 0.12) {
        consecutiveRef.current += 1;
        if (consecutiveRef.current >= 2) triggerDistraction();
      } else {
        consecutiveRef.current = 0;
      }
    } catch {
      // skip frame silently
    }
  }, [triggerDistraction]);

  // Keep a stable ref so setInterval always calls latest version
  const analyzeFrameRef = useRef(analyzeFrame);
  useEffect(() => { analyzeFrameRef.current = analyzeFrame; }, [analyzeFrame]);

  /* ── Forced logout ─────────────────────────────── */
  function startLogoutCountdown() {
    if (logoutTimerRef.current) return;
    let n = 10;
    setLogoutCountdown(n);
    logoutTimerRef.current = setInterval(() => {
      n -= 1;
      setLogoutCountdown(n);
      if (n <= 0) {
        clearInterval(logoutTimerRef.current!);
        logoutTimerRef.current = null;
        doForcedLogout();
      }
    }, 1000);
  }

  async function doForcedLogout() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (detectionRef.current) clearInterval(detectionRef.current);
    const supabase = createClient();
    await supabase?.auth.signOut();
    router.push("/login?reason=distraction");
  }

  function cancelLogout() {
    if (logoutTimerRef.current) {
      clearInterval(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    setLogoutCountdown(10);
    setDistractionLevel(2);
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
      router.push(config?.includeChallenge && challenge ? "/challenge" : "/report");
    } else {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    }
  }

  // Keep saveAndNext ref current for timer auto-submit
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
        onCancel={cancelLogout}
      />

      {/* Webcam feed — required */}
      <WebcamFeed videoRef={videoRef} />

      {/* Progress bar */}
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

        {/* Question card */}
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
            You can proceed without answering — Claude will note the skipped question.
          </p>
        )}
      </main>
    </PageWrapper>
  );
}
