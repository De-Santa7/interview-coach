import { HiringVerdict } from "@/lib/types";

const CONFIG: Record<
  HiringVerdict,
  { bg: string; text: string; border: string; dot: string }
> = {
  "Strong Hire": {
    bg: "#edf7f3",
    text: "#1e6647",
    border: "#a7d9c3",
    dot: "#3d9970",
  },
  Hire: {
    bg: "#fef8ec",
    text: "#7a5b12",
    border: "#e8c96a",
    dot: "#c49a2a",
  },
  Maybe: {
    bg: "#fff7ed",
    text: "#9a4f1a",
    border: "#fbc99a",
    dot: "#f97316",
  },
  "No Hire": {
    bg: "#fdf2f2",
    text: "#8b2222",
    border: "#f4aaaa",
    dot: "#e05252",
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
      }}
    >
      <span
        className="rounded-full flex-shrink-0"
        style={{
          width: large ? 10 : 7,
          height: large ? 10 : 7,
          background: c.dot,
        }}
      />
      {verdict}
    </span>
  );
}
