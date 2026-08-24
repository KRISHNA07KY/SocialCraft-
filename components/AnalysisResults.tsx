"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import type { Analysis } from "@/lib/analysis-schema";

const emojiPattern = /[\uD83C-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]\uFE0F?|\uFE0F|\u20E3/g;
const keycapPattern = /[0-9#*]\uFE0F?\u20E3/g;

export function normalizeEditorialText(value: string) {
  return value
    .replace(keycapPattern, "")
    .replace(emojiPattern, "")
    .replace(/^[ \t]+/gm, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function Section({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`result-section ${className}`}>
      <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{title}</h3>
      <div className="mt-3 text-[16px] leading-7 text-ink">{children}</div>
    </section>
  );
}

function BulletList({ items, tone = "primary" }: { items: string[]; tone?: "primary" | "coral" }) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-3 text-[16px]">
          <span className={`mt-[0.65rem] h-1.5 w-1.5 shrink-0 rounded-full ${tone === "coral" ? "bg-coral" : "bg-primary"}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function NumberedSuggestions({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2.5">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="suggestion-item text-[16px]">
          <span className="suggestion-number">{String(index + 1).padStart(2, "0")}</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

export function AnalysisResults({ analysis }: { analysis: Analysis }) {
  const [copied, setCopied] = useState(false);
  const improvedVersion = normalizeEditorialText(analysis.improvedVersion);

  const copyImprovedVersion = async () => {
    try {
      await navigator.clipboard.writeText(improvedVersion);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-5" aria-label="Content analysis results">
      {/* Top Row: Overall Assessment + Engagement Score */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_.6fr]">
        <Section title="Overall assessment">
          <p className="text-base leading-7">{analysis.overallAssessment}</p>
        </Section>
        <div id="engagement-score" className="result-section flex items-center justify-between gap-4">
          <div>
            <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-primary">
              AI ANALYSIS
            </span>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-muted">Engagement score</p>
            <p className="mt-1.5 max-w-[14rem] text-xs leading-5 text-muted">Based on clarity, structure, and audience appeal.</p>
          </div>
          <div
            className="score-ring relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full shadow-md"
            style={{ "--score": `${analysis.engagementScore}%` } as React.CSSProperties}
            role="img"
            aria-label={`Engagement score ${analysis.engagementScore} out of 100`}
          >
            <div className="flex h-[4.4rem] w-[4.4rem] flex-col items-center justify-center rounded-full bg-surface shadow-inner">
              <span className="text-2xl font-bold text-ink">{analysis.engagementScore}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted">/ 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Section */}
      <div id="metrics" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Section title="What works">
            <BulletList items={analysis.strengths} />
          </Section>
          <Section title="Areas to improve">
            <BulletList items={analysis.weaknesses} tone="coral" />
          </Section>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Section title="Content clarity">
            <p>{analysis.hookAnalysis}</p>
          </Section>
          <Section title="Audience relevance">
            <p>{analysis.audienceAppeal}</p>
          </Section>
          <Section title="Readability">
            <p>{analysis.readability}</p>
          </Section>
          <Section title="Actionable suggestions">
            <NumberedSuggestions items={analysis.suggestions} />
          </Section>
        </div>
      </div>

      {/* Improved Version Section */}
      <section id="improved-version" className="overflow-hidden rounded-2xl border border-primary/30 bg-surface-secondary text-ink shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                IMPROVED VERSION
              </span>
            </div>
            <h3 className="mt-1 text-sm font-bold uppercase tracking-[0.14em] text-primary">Polished Editorial Draft</h3>
            <p className="mt-0.5 text-xs text-muted">A suggested direction to test for higher engagement.</p>
          </div>
          <button
            type="button"
            onClick={copyImprovedVersion}
            className="secondary-button inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold"
            aria-label="Copy improved version"
          >
            {copied ? <Check aria-hidden="true" className="h-4 w-4 text-primary" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="whitespace-pre-wrap px-5 py-6 text-[16px] leading-8 text-ink font-normal sm:px-6">{improvedVersion}</div>
      </section>
    </div>
  );
}
