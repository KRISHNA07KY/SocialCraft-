"use client";

import { useEffect, useState } from "react";

const sections = [
  { id: "ocr", label: "OCR" },
  { id: "extracted-text", label: "Extracted Text" },
  { id: "engagement-score", label: "Engagement Score" },
  { id: "metrics", label: "Metrics" },
  { id: "improved-version", label: "Improved Version" },
] as const;

export function AnalysisSectionNav() {
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
  };

  return (
    <>
      {/* Desktop / Laptop compact right-side vertical rail */}
      <nav
        aria-label="Analysis section navigation"
        className="hidden lg:block sticky top-6 z-30 ml-auto w-44 shrink-0 rounded-xl border border-line bg-surface/95 p-3 shadow-md backdrop-blur"
      >
        <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Jump to section</p>
        <div className="space-y-1">
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

      {/* Mobile / Tablet compact horizontal navigation bar */}
      <nav
        aria-label="Analysis section navigation mobile"
        className="block lg:hidden mb-4 overflow-x-auto rounded-xl border border-line bg-surface/95 p-2 backdrop-blur scrollbar-none"
      >
        <div className="flex items-center gap-1.5 min-w-max">
          {sections.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollTo(id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition ${
                activeId === id ? "bg-primary text-white" : "bg-canvas text-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
