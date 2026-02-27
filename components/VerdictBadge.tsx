import { HiringVerdict } from "@/lib/types";

const CONFIG: Record<
  HiringVerdict,
  { bg: string; text: string; border: string; dot: string; emoji: string }
> = {
  "Strong Hire": {
    bg: "linear-gradient(135deg, #edf7f3, #d8f5ec)",
    text: "#0e5c38",
    border: "#7dd4b0",
    dot: "#06d6a0",
    emoji: "🟢",
  },
  Hire: {
    bg: "linear-gradient(135deg, #e0f7fc, #d0f2fa)",
    text: "#0d6680",
    border: "#7ecfed",
    dot: "#00b4d8",
    emoji: "🔵",
  },
  Maybe: {
    bg: "linear-gradient(135deg, #fef8ec, #fdf2d0)",
    text: "#7a5b12",
    border: "#e8c96a",
    dot: "#e8b923",
    emoji: "🟡",
  },
  "No Hire": {
    bg: "linear-gradient(135deg, #fdf2f2, #fce8e8)",
    text: "#8b2222",
    border: "#f4aaaa",
    dot: "#ef476f",
    emoji: "🔴",
  },
};

interface VerdictBadgeProps {
  verdict: HiringVerdict;
  large?: boolean;
}

export default function VerdictBadge({ verdict, large = false }: VerdictBadgeProps) {
  const c = CONFIG[verdict];
  return (
    <span
      className="inline-flex items-center gap-2 font-semibold rounded-full border"
      style={{
        background: c.bg,
        color: c.text,
        borderColor: c.border,
        padding: large ? "10px 24px" : "5px 14px",
        fontSize: large ? "1.05rem" : "0.78rem",
        fontFamily: "var(--font-fraunces)",
        letterSpacing: large ? "0.01em" : "0.03em",
        boxShadow: large ? `0 4px 16px ${c.dot}30` : "none",
      }}
    >
      <span
        className="rounded-full flex-shrink-0 animate-pulse"
        style={{
          width: large ? 10 : 7,
          height: large ? 10 : 7,
          background: c.dot,
          boxShadow: `0 0 6px ${c.dot}`,
        }}
      />
      {verdict}
    </span>
  );
}
