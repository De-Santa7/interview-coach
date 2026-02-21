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
      className="inline-flex items-center gap-1.5 text-sm text-body hover:text-charcoal transition-colors group"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="group-hover:-translate-x-0.5 transition-transform duration-150"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {label}
    </button>
  );
}
