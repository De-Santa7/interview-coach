interface LogoIconProps {
  size?: number;
  className?: string;
}

/**
 * SVG recreation of the InterviewCoach hexagon-speech-bubble icon mark.
 * Works on any background (transparent, dark, light).
 * Colors mirror the actual logo: dark brown border, gold fill, white figure.
 */
export default function LogoIcon({ size = 32, className = "" }: LogoIconProps): React.ReactElement {
  const h = Math.round(size * 112 / 100);
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 100 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* ── Outer shape: hexagon + speech-bubble tail (dark brown) ── */}
      <path
        fill="#3d2008"
        d="M50 4
           L84 23 L84 71
           L66 82 L55 82
           L43 110
           L31 82 L16 71
           L16 23 Z"
      />

      {/* ── White inner ring (creates the thin white border effect) ── */}
      <path
        fill="#ffffff"
        d="M50 11
           L79 27 L79 67
           L63 77 L53 77 L43 77
           L21 67 L21 27 Z"
      />

      {/* ── Gold fill hexagon ── */}
      <path
        fill="#c49a2a"
        d="M50 16
           L76 31 L76 65
           L62 73 L50 73 L38 73
           L24 65 L24 31 Z"
      />

      {/* ── Gold gradient overlay for depth ── */}
      <defs>
        <linearGradient id="goldGrad" x1="50" y1="16" x2="50" y2="73" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e0b840" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#9a7010" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <path
        fill="url(#goldGrad)"
        d="M50 16 L76 31 L76 65 L62 73 L50 73 L38 73 L24 65 L24 31 Z"
      />

      {/* ── White figure: head ── */}
      <circle cx="50" cy="37" r="11.5" fill="#ffffff" />

      {/* ── White figure: torso / shoulders ── */}
      <path
        fill="#ffffff"
        d="M24 74 C24 55 36 50 50 50 C64 50 76 55 76 74 Z"
      />

      {/* ── Dark brown tie ── */}
      <path
        fill="#3d2008"
        d="M47.5 53.5 L52.5 53.5 L54.5 67 L50 71.5 L45.5 67 Z"
      />
    </svg>
  );
}
