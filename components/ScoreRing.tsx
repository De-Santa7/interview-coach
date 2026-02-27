"use client";
import { useEffect, useRef, useId } from "react";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

function scoreGradient(score: number): [string, string] {
  if (score >= 80) return ["#06d6a0", "#00b4d8"]; // teal/success
  if (score >= 60) return ["#e8b923", "#00b4d8"]; // gold/teal
  if (score >= 40) return ["#ffd166", "#e8b923"]; // warning/gold
  return ["#ef476f", "#c0392b"]; // danger
}

export default function ScoreRing({
  score,
  size = 130,
  strokeWidth = 11,
  label,
}: ScoreRingProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const uid = useId().replace(/:/g, "");
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (score / 100) * circumference;
  const [gradStart, gradEnd] = scoreGradient(score);

  useEffect(() => {
    const circle = circleRef.current;
    if (!circle) return;
    circle.style.strokeDasharray = `${circumference}`;
    circle.style.strokeDashoffset = `${circumference}`;
    const t = setTimeout(() => {
      circle.style.strokeDashoffset = `${targetOffset}`;
    }, 80);
    return () => clearTimeout(t);
  }, [circumference, targetOffset]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: "rotate(-90deg)" }}
          aria-label={`Score: ${score} out of 100`}
        >
          <defs>
            <linearGradient id={`ring-grad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradStart} />
              <stop offset="100%" stopColor={gradEnd} />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--ring-track)"
            strokeWidth={strokeWidth}
          />
          {/* Fill arc with gradient */}
          <circle
            ref={circleRef}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#ring-grad-${uid})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="score-ring-fill"
          />
        </svg>
        {/* Centre label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono font-semibold text-charcoal leading-none"
            style={{ fontSize: size * 0.22 }}
          >
            {score}
          </span>
          <span
            className="font-mono text-muted leading-none mt-0.5"
            style={{ fontSize: size * 0.1 }}
          >
            /100
          </span>
        </div>
      </div>
      {label && <span className="label">{label}</span>}
    </div>
  );
}
