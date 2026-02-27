"use client";
import { useRouter } from "next/navigation";

interface BackButtonProps {
  /** If provided, navigates to this path. Otherwise calls router.back(). */
  href?: string;
  label?: string;
}

export default function BackButton({ href, label = "Back" }: BackButtonProps): React.ReactElement {
  const router = useRouter();

  function handleClick() {
    if (href) router.push(href);
    else router.back();
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 text-sm text-body hover:text-charcoal transition-all duration-150 group px-3 py-1.5 rounded-lg hover:bg-border/40"
    >
      <span
        className="w-6 h-6 rounded-md flex items-center justify-center transition-all duration-150 group-hover:-translate-x-0.5"
        style={{
          background: "linear-gradient(145deg, #f8f6f0, #ebe8e0)",
          border: "1px solid var(--c-border)",
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </span>
      {label}
    </button>
  );
}
