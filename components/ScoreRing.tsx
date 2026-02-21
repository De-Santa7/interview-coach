"use client";
import { useEffect, useRef } from "react";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

function scoreColor(score: number) {
  if (score >= 80) return "#3d9970";
  if (score >= 60) return "#c49a2a";
  if (score >= 40) return "#f97316";
  return "#e05252";
}

export default function ScoreRing({
  score,
  size = 130,
  strokeWidth = 11,
  label,
}: ScoreRingProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);

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
          {/* Shadow track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#ebe8e0"
            strokeWidth={strokeWidth}
          />
          {/* Fill arc */}
          <circle
            ref={circleRef}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            className="score-ring-fill"
          />
        </svg>
        {/* Centre label — absolute overlay */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ transform: "rotate(0deg)" }}
        >
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
      {label && (
        <span className="label">{label}</span>
      )}
    </div>
  );
}
