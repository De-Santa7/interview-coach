"use client";
import { useEffect, useRef } from "react";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add("page-anim");
    const id = requestAnimationFrame(() => {
      el.classList.add("page-anim-active");
      el.classList.remove("page-anim");
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div ref={ref} className="min-h-screen bg-bg">
      {children}
    </div>
  );
}
