"use client";

import { useEffect, useState } from "react";

const sections = [
  { id: "ocr", label: "OCR" },
  { id: "extracted-text", label: "Extracted Text" },
  { id: "engagement-score", label: "Engagement Score" },
  { id: "metrics", label: "Metrics" },
  { id: "improved-version", label: "Improved Version" },
] as const;

export function AnalysisSectionNav({ onNavigate }: { onNavigate?: () => void }) {
  const [activeId, setActiveId] = useState<string>("ocr");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-15% 0px -60% 0px" }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    onNavigate?.();
  };

  return (
    <nav aria-label="Analysis section navigation">
      <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Jump to section</p>
      <div className="space-y-0.5">
        {sections.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => scrollTo(id)}
            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold transition ${
              activeId === id
                ? "bg-surface-secondary text-primary font-bold shadow-xs"
                : "text-muted hover:bg-canvas hover:text-ink"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${activeId === id ? "bg-primary" : "bg-muted/40"}`} />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
