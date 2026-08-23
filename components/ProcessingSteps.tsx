type Stage = "reading" | "analyzing" | "saving" | null;

const steps = [
  { id: "reading", label: "Extracting content" },
  { id: "analyzing", label: "Analyzing content" },
  { id: "saving", label: "Saving analysis" }
] as const;

export function ProcessingSteps({ stage }: { stage: Stage }) {
  if (!stage) return null;
  return <div className="processing-panel" aria-live="polite"><div className="flex flex-wrap gap-x-7 gap-y-3">{steps.map((step, index) => { const active = step.id === stage; const complete = index < steps.findIndex((item) => item.id === stage); return <div key={step.id} className="flex items-center gap-3 text-base"><span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${active ? "bg-primary text-white" : complete ? "bg-surface-secondary text-primary" : "bg-surface text-muted"}`}>{complete ? "✓" : index + 1}</span><span className={active ? "font-bold text-ink" : "text-muted"}>{step.label}{active && <span className="ml-1 animate-pulse">…</span>}</span></div>; })}</div></div>;
}
