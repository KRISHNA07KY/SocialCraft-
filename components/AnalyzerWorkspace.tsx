"use client";

import { ArrowLeft, ArrowRight, Check, History, Palette, Save, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { AnalysisResults } from "@/components/AnalysisResults";
import { AnalysisSectionNav } from "@/components/AnalysisSectionNav";
import { BrandMark } from "@/components/BrandMark";
import { ProcessingSteps } from "@/components/ProcessingSteps";
import { ProductSidebar, MobileMenuButton, type ProfileSummary, type ProductView } from "@/components/ProductSidebar";
import { UploadDropzone } from "@/components/UploadDropzone";
import { ThemeSwatch, ThemeToggle } from "@/components/ThemeToggle";
import { useTheme, type ThemeName } from "@/components/ThemeProvider";
import { AnalysisSchema, type Analysis } from "@/lib/analysis-schema";
import { firebaseAuth } from "@/lib/firebase/client";
import { getAnalysisSession, getUserProfile, listAnalysisSessions, saveAnalysisSession, submitFeedback, updateUserProfile } from "@/lib/firebase/persistence";

type Stage = "reading" | "analyzing" | "saving" | null;
type SaveStatus = "idle" | "saving" | "saved" | "error";
type ProfileData = ProfileSummary & { id: string; createdAt: string; provider: string | null };
type HistorySummary = { id: string; filename: string; file_type: string; extracted_text: string; ocr_confidence: number | null; analysis_result: Analysis; engagement_score: number; created_at: string };
type HistorySession = HistorySummary;

async function readError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error || fallback;
  } catch {
    return fallback;
  }
}

function PageIntro({ eyebrow, title, description, hero = false }: { eyebrow: string; title: React.ReactNode; description: string; hero?: boolean }) {
  return (
    <div className={`page-intro ${hero ? "page-intro-hero" : ""}`}>
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-coral">{eyebrow}</p>
      <h1 className="editorial-display max-w-3xl text-3xl font-bold leading-[1.1] tracking-[-0.03em] text-ink sm:text-5xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-base leading-7 text-muted">{description}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function getView(pathname: string): ProductView {
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/history")) return "history";
  if (pathname.startsWith("/settings")) return "settings";
  if (pathname.startsWith("/help")) return "help";
  if (pathname.startsWith("/profile")) return "profile";
  return "analyze";
}

function DashboardView({ onNavigate }: { onNavigate: (view: ProductView) => void }) {
  return (
    <div className="max-w-5xl space-y-4">
      <PageIntro
        eyebrow="YOUR WORKSPACE"
        title="A calmer way to sharpen your content."
        description="SocialCraft turns a post, screenshot, or document into a concise editorial brief you can act on."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <section className="surface-card p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Start here</p>
          <h2 className="mt-2 text-2xl font-bold text-ink">Analyze a piece of content</h2>
          <p className="mt-2 text-base leading-7 text-muted">
            Upload a PDF or image to extract the source text, review it, and generate actionable recommendations.
          </p>
          <button
            type="button"
            onClick={() => onNavigate("analyze")}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-base font-bold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
          >
            Open analyzer <ArrowRight aria-hidden="true" className="h-5 w-5" />
          </button>
        </section>
        <section className="surface-card p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Your workflow</p>
          <ol className="mt-3.5 space-y-3 text-base text-ink">
            <li className="flex items-center gap-3">
              <span className="step-dot">01</span>
              <span>Extract the source content</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="step-dot">02</span>
              <span>Review what was read</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="step-dot">03</span>
              <span>Improve the next draft</span>
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}

function HistoryView({ onOpen }: { onOpen: (id: string) => void }) {
  const [sessions, setSessions] = useState<HistorySummary[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listAnalysisSessions(firebaseAuth.currentUser)
      .then(setSessions)
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "We couldn't load your history."))
      .finally(() => setLoading(false));
  }, []);

  const visible = sessions.filter((session) =>
    `${session.filename} ${session.analysis_result.overallAssessment}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-5xl space-y-4">
      <PageIntro eyebrow="HISTORY" title="Your editorial trail, in one place." description="Revisit completed analyses and keep improving the way you communicate." />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="sr-only" htmlFor="history-search">
          Search history
        </label>
        <input
          id="history-search"
          className="field-input max-w-md"
          placeholder="Search filename or summary"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <span className="text-sm text-muted">
          {sessions.length} {sessions.length === 1 ? "analysis" : "analyses"}
        </span>
      </div>
      {loading && <div className="surface-card p-6 text-base text-muted">Loading your history…</div>}
      {error && <div className="surface-warning rounded-xl border px-4 py-3 text-base" role="alert">{error}</div>}
      {!loading && !error && visible.length === 0 && (
        <section className="surface-card p-8 text-center sm:p-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-surface-secondary text-primary">
            <History aria-hidden="true" className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-2xl font-bold text-ink">No analyses yet.</h2>
          <p className="mx-auto mt-2 max-w-md text-base leading-7 text-muted">
            Your analyzed content will appear here so you can revisit and improve it later.
          </p>
        </section>
      )}
      {!loading && visible.length > 0 && (
        <div className="space-y-3">
          {visible.map((session) => (
            <button key={session.id} type="button" onClick={() => onOpen(session.id)} className="history-item">
              <span className="flex min-w-0 flex-1 items-start gap-4">
                <span className="file-type-badge">{session.file_type.split("/").pop()?.toUpperCase() || "FILE"}</span>
                <span className="min-w-0 text-left">
                  <span className="block truncate text-lg font-bold text-ink">{session.filename}</span>
                  <span className="mt-1 block text-sm leading-6 text-muted">{session.analysis_result.overallAssessment}</span>
                  <span className="mt-1.5 block text-xs text-muted">{formatDate(session.created_at)}</span>
                </span>
              </span>
              <span className="history-score">
                {session.engagement_score}
                <small>/100</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryDetailView({ id, onBack }: { id: string; onBack: () => void }) {
  const [session, setSession] = useState<HistorySession | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAnalysisSession(firebaseAuth.currentUser, id)
      .then(setSession)
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "We couldn't load that analysis."));
  }, [id]);

  if (error)
    return (
      <div className="max-w-3xl">
        <button type="button" onClick={onBack} className="back-link">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to history
        </button>
        <div className="surface-warning mt-5 rounded-xl border px-4 py-3 text-base" role="alert">
          {error}
        </div>
      </div>
    );

  if (!session) return <div className="surface-card p-6 text-base text-muted">Loading saved analysis…</div>;
  const parsed = AnalysisSchema.safeParse(session.analysis_result);
  if (!parsed.success) return <div className="surface-warning rounded-xl border px-4 py-3 text-base">This saved analysis has an invalid result format.</div>;

  return (
    <div className="max-w-5xl space-y-5">
      <button type="button" onClick={onBack} className="back-link">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to history
      </button>
      <div>
        <span className="inline-block rounded-md bg-coral/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-coral">
          SAVED ANALYSIS
        </span>
        <h1 className="editorial-display mt-1.5 text-3xl font-bold tracking-[-0.03em] text-ink sm:text-4xl">{session.filename}</h1>
        <p className="mt-1.5 text-sm text-muted">
          {formatDate(session.created_at)} · {session.file_type} · {session.ocr_confidence !== null ? `${session.ocr_confidence}% OCR confidence` : "Extracted text"}
        </p>
      </div>

      <section id="extracted-text" className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
        <div className="flex items-center justify-between border-b border-line px-5 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-muted/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-muted">
              SOURCE / OCR TEXT
            </span>
            <h2 className="text-base font-bold text-ink">Extracted text</h2>
          </div>
        </div>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap px-5 py-4 text-base leading-7 text-ink/85 sm:px-6">{session.extracted_text}</pre>
      </section>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral">YOUR EDITORIAL BRIEF</p>
        <h2 className="mt-1 text-2xl font-bold text-ink">What your content is saying</h2>
      </div>
      <AnalysisResults analysis={parsed.data} />
    </div>
  );
}

function HelpView() {
  const steps = ["Upload a PDF or image", "Extract the text", "Review the extracted content", "Analyze the content", "Improve the post"];
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submitFeedbackForm = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    setError("");
    try {
      await submitFeedback(firebaseAuth.currentUser, email, message);
      setStatus("Thanks — your feedback was sent.");
      setEmail("");
      setMessage("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't send your feedback.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-4">
      <PageIntro eyebrow="HELP" title="A quick guide to SocialCraft." description="A focused workflow for turning raw content into a clearer, more useful post." />
      <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
        <section className="surface-card p-5 sm:p-6">
          <h2 className="text-xl font-bold text-ink">How it works</h2>
          <ol className="mt-4 space-y-3.5">
            {steps.map((step, index) => (
              <li key={step} className="flex items-center gap-3 text-base text-ink">
                <span className="step-dot">{String(index + 1).padStart(2, "0")}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-6 border-t border-line pt-4">
            <h2 className="text-xl font-bold text-ink">Supported files</h2>
            <p className="mt-2 text-base leading-7 text-muted">PDF, PNG, JPG, and JPEG files up to 10 MB.</p>
          </div>
        </section>
        <section className="surface-card p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">FEEDBACK</p>
          <h2 className="mt-1.5 text-2xl font-bold text-ink">Have feedback?</h2>
          <p className="mt-1.5 text-base leading-7 text-muted">Tell us what worked, what didn&apos;t, or what you&apos;d like to see next.</p>
          <form onSubmit={submitFeedbackForm} className="mt-4 space-y-3">
            <label className="field-label">
              Your email <span className="font-normal text-muted">(optional)</span>
              <input className="field-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            </label>
            <label className="field-label">
              Your message
              <textarea
                className="field-input min-h-24 resize-y"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Tell us what you think…"
                required
                minLength={3}
                maxLength={2000}
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-base font-bold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send feedback"}
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </button>
            {(status || error) && (
              <p
                className={`rounded-xl border px-4 py-3 text-sm ${
                  error ? "surface-warning" : "border-primary/25 bg-surface-secondary text-ink"
                }`}
                role="status"
              >
                {status || error}
              </p>
            )}
          </form>
          <p className="mt-4 text-sm text-muted">
            Need direct help?{" "}
            <a className="font-bold text-primary hover:underline" href="mailto:support@socialcraft.app">
              Email support
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}

function SettingsView({ theme, onThemeChange }: { theme: ThemeName; onThemeChange: (theme: ThemeName) => void }) {
  const options = [
    { id: "sunrise", label: "Sunrise", description: "Warm light background, cream surfaces, dark readable text." },
    { id: "sunset", label: "Sunset", description: "Deep terracotta & warm dark red surfaces with rich contrast." },
    { id: "moon", label: "Moon", description: "Deep navy & charcoal blue-black canvas for quiet night editing." },
  ] as const;

  return (
    <div className="max-w-5xl space-y-4">
      <PageIntro
        eyebrow="SETTINGS"
        title="Make the workspace feel like yours."
        description="Choose one of three visual identities. Your preference is saved on this device and persists across sessions."
      />
      <section className="surface-card p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-secondary text-primary shadow-sm">
            <Palette aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-ink">Themes</h2>
            <p className="mt-1 text-sm text-muted">Sunrise is the light experience; Sunset and Moon offer rich dark experiences.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {options.map(({ id, label, description }) => (
            <button
              key={id}
              type="button"
              aria-pressed={theme === id}
              onClick={() => onThemeChange(id)}
              className={`theme-option ${theme === id ? "theme-option-active" : ""}`}
            >
              <span className="flex items-center justify-between">
                <ThemeSwatch theme={id} />
                <span className="theme-check">{theme === id ? <Check aria-hidden="true" className="h-3.5 w-3.5" /> : null}</span>
              </span>
              <span className="mt-3.5 block text-left text-base font-bold text-ink">{label}</span>
              <span className="mt-1 block text-left text-xs leading-5 text-muted">{description}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProfileView({ profile, onProfileChange }: { profile: ProfileData | null; onProfileChange: (profile: ProfileData) => void }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || "");
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const profile = await updateUserProfile(firebaseAuth.currentUser, displayName, avatarUrl || null);
      onProfileChange(profile);
      setEditing(false);
      setMessage("Profile updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't update your profile.");
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(firebaseAuth);
    router.replace("/login");
  };

  if (!profile) return <div className="surface-card p-6 text-base text-muted">Loading your profile…</div>;

  return (
    <div className="max-w-3xl space-y-4">
      <PageIntro eyebrow="YOUR PROFILE" title="Your account, at a glance." description="Manage the identity attached to your saved analyses." />
      <section className="surface-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="profile-avatar profile-avatar-large">
              {profile.avatarUrl ? (
                <span className="profile-avatar-image" style={{ backgroundImage: "url(" + profile.avatarUrl + ")" }} role="img" aria-label="Profile picture" />
              ) : (
                <UserRound aria-hidden="true" className="h-7 w-7" />
              )}
            </span>
            <div>
              <h2 className="text-2xl font-bold text-ink">{profile.displayName || "Your Profile"}</h2>
              <p className="mt-0.5 text-base text-muted">{profile.email}</p>
            </div>
          </div>
          <button type="button" onClick={() => setEditing((current) => !current)} className="secondary-button">
            {editing ? "Cancel" : "Edit profile"}
          </button>
        </div>
        {editing ? (
          <form onSubmit={save} className="mt-6 space-y-3.5 border-t border-line pt-5">
            <label className="field-label">
              Name
              <input className="field-input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required maxLength={80} />
            </label>
            <label className="field-label">
              Avatar URL <span className="font-normal text-muted">(optional)</span>
              <input className="field-input" type="url" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://…" />
            </label>
            <button type="submit" disabled={busy} className="rounded-xl bg-primary px-5 py-3 text-base font-bold text-white disabled:opacity-60">
              {busy ? "Saving…" : "Save profile"}
            </button>
            {(message || error) && (
              <p
                className={error ? "surface-warning rounded-xl border px-4 py-3 text-sm" : "rounded-xl border border-primary/25 bg-surface-secondary px-4 py-3 text-sm text-ink"}
                role="status"
              >
                {message || error}
              </p>
            )}
          </form>
        ) : (
          <dl className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Connected provider</dt>
              <dd className="mt-1 text-base font-semibold text-ink">{profile.provider || "Email and password"}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Account created</dt>
              <dd className="mt-1 text-base font-semibold text-ink">{formatDate(profile.createdAt)}</dd>
            </div>
          </dl>
        )}
        <button type="button" onClick={signOut} className="mt-6 inline-flex items-center gap-2 text-base font-bold text-coral hover:underline">
          <UserRound aria-hidden="true" className="h-5 w-5" />
          Sign out
        </button>
      </section>
    </div>
  );
}

export function AnalyzerWorkspace() {
  const pathname = usePathname() || "/analyze";
  const router = useRouter();
  const view = getView(pathname);
  const { theme, setTheme } = useTheme();
  const [authReady, setAuthReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [selectionError, setSelectionError] = useState("");
  const [stage, setStage] = useState<Stage>(null);
  const [extractedText, setExtractedText] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [ocrWarning, setOcrWarning] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() =>
    onAuthStateChanged(firebaseAuth, (user) => {
      if (!user) router.replace("/login");
      else setAuthReady(true);
    }),
  [router]);

  useEffect(() => {
    if (!authReady) return;
    getUserProfile(firebaseAuth.currentUser).then(setProfile).catch(() => undefined);
  }, [authReady]);

  const navigate = (nextView: ProductView) => router.push(`/${nextView}`);

  const onFileChange = (nextFile: File | null, nextError?: string) => {
    setFile(nextFile);
    setSelectionError(nextError || "");
    setError("");
    setExtractedText("");
    setAnalysis(null);
    setSourceType("");
    setOcrConfidence(null);
    setOcrWarning("");
    setSaveStatus("idle");
    setSaveMessage("");
  };

  const analyze = async () => {
    if (!file || stage) return;
    setError("");
    setExtractedText("");
    setAnalysis(null);
    setOcrConfidence(null);
    setOcrWarning("");
    setSaveStatus("idle");
    setSaveMessage("");
    setStage("reading");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const extractionResponse = await fetch("/api/extract", { method: "POST", body: formData });
      if (!extractionResponse.ok) throw new Error(await readError(extractionResponse, "We couldn't extract text from that file."));
      const extraction = (await extractionResponse.json()) as { text: string; sourceType: string; ocrConfidence?: number; ocrWarning?: string };
      setExtractedText(extraction.text);
      setSourceType(extraction.sourceType);
      setOcrConfidence(typeof extraction.ocrConfidence === "number" ? extraction.ocrConfidence : null);
      setOcrWarning(extraction.ocrWarning || "");
      setStage("analyzing");
      const analysisResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extraction.text }),
      });
      if (!analysisResponse.ok) throw new Error(await readError(analysisResponse, "We couldn't analyze that content."));
      const result = (await analysisResponse.json()) as { analysis: Analysis };
      setAnalysis(result.analysis);
      setStage("saving");
      setSaveStatus("saving");
      try {
        await saveAnalysisSession(firebaseAuth.currentUser, {
          filename: file.name,
          fileType: file.type || "unknown",
          extractedText: extraction.text,
          ocrConfidence: typeof extraction.ocrConfidence === "number" ? extraction.ocrConfidence : null,
          analysis: result.analysis,
        });
        setSaveStatus("saved");
        setSaveMessage("Analysis saved to your history.");
      } catch (caught) {
        setSaveStatus("error");
        setSaveMessage(caught instanceof Error ? caught.message : "Your analysis is ready, but it couldn't be saved to history.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setStage(null);
    }
  };

  const renderAnalyzer = () => (
    <>
      <div id="ocr" className="grid gap-5 xl:grid-cols-[0.88fr_1.12fr] xl:gap-7">
        <div>
          <PageIntro
            hero
            eyebrow="MAKE EVERY WORD COUNT"
            title={
              <>
                Turn raw posts into <span className="text-primary">stronger signals.</span>
              </>
            }
            description="Upload a post, screenshot, or document. Get an editor's eye on the hook, message, and next best move."
          />
          <div className="mt-4 hidden items-center gap-4 text-xs font-bold uppercase tracking-[0.12em] text-muted sm:flex">
            <span>01 · Extract</span>
            <span className="h-px w-6 bg-line" />
            <span>02 · Understand</span>
            <span className="h-px w-6 bg-line" />
            <span>03 · Improve</span>
          </div>
        </div>
        <section className="surface-card p-4 sm:p-5" aria-labelledby="upload-heading">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <h2 id="upload-heading" className="text-xl font-bold text-ink">Bring your content</h2>
              <p className="mt-0.5 text-sm text-muted">We&apos;ll read it, then help you sharpen it.</p>
            </div>
            <span className="rounded-lg bg-surface-secondary px-2.5 py-1 text-xs font-bold text-primary">Private by default</span>
          </div>
          <UploadDropzone file={file} onFileChange={onFileChange} />
          <div className="mt-3.5">
            <button
              type="button"
              onClick={analyze}
              disabled={!file || Boolean(stage)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-base font-bold text-white shadow-lg shadow-primary/15 transition hover:bg-primary-hover focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:bg-primary-muted disabled:shadow-none"
            >
              {stage ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                  {stage === "reading" ? "Extracting content" : stage === "analyzing" ? "Analyzing content" : "Saving analysis"}
                </>
              ) : (
                <>
                  Analyze my content <ArrowRight aria-hidden="true" className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
          {selectionError && (
            <p className="surface-warning mt-3 rounded-lg border px-3 py-2 text-sm font-medium" role="alert">
              {selectionError}
            </p>
          )}
        </section>
      </div>

      <div className="mt-4 space-y-4">
        <ProcessingSteps stage={stage} />
        {error && (
          <div className="surface-warning flex items-start gap-3 rounded-xl border px-4 py-3 text-base" role="alert">
            <span aria-hidden="true" className="font-bold">!</span>
            <p>{error}</p>
          </div>
        )}
        {saveMessage && (
          <p
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-base ${
              saveStatus === "error" ? "surface-warning" : "border-primary/25 bg-surface-secondary text-ink"
            }`}
            role="status"
          >
            {saveStatus === "saved" ? <Save aria-hidden="true" className="h-5 w-5 text-primary" /> : null}
            {saveMessage}
          </p>
        )}
        {extractedText && (
          <section id="extracted-text" className="overflow-hidden rounded-xl border border-line bg-surface shadow-xs" aria-labelledby="extracted-heading">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-coral/10 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-coral">
                  SOURCE / OCR TEXT
                </span>
                <div>
                  <h2 id="extracted-heading" className="text-lg font-bold text-ink">Extracted source text</h2>
                  <p className="text-xs text-muted">
                    {sourceType}
                    {ocrConfidence !== null ? ` · ${ocrConfidence}% confidence` : ""} · Faithfully read from document
                  </p>
                </div>
              </div>
              <span className="rounded-lg bg-canvas px-2.5 py-1 text-xs font-semibold text-muted">
                {extractedText.length.toLocaleString()} characters
              </span>
            </div>
            {ocrWarning && (
              <p className="surface-warning border-b px-5 py-2.5 text-sm font-medium sm:px-6" role="status">
                {ocrWarning}
              </p>
            )}
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap px-5 py-4 text-base leading-7 text-ink/85 sm:px-6 font-mono">{extractedText}</pre>
          </section>
        )}

        {analysis && (
          <div className="relative lg:flex lg:items-start lg:gap-6">
            <div className="min-w-0 flex-1">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-primary">
                    AI ANALYSIS
                  </span>
                  <h2 className="mt-1 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                    What your content is saying
                  </h2>
                </div>
                <p className="text-sm text-muted">Grounded in the source text provided.</p>
              </div>
              <AnalysisResults analysis={analysis} />
            </div>

            {/* Analysis Section Mini Navigation */}
            <AnalysisSectionNav />
          </div>
        )}
      </div>
    </>
  );

  const renderView = () => {
    if (view === "dashboard") return <DashboardView onNavigate={navigate} />;
    if (view === "history") {
      const parts = pathname.split("/").filter(Boolean);
      return parts.length > 1 ? (
        <HistoryDetailView id={parts[1]} onBack={() => router.push("/history")} />
      ) : (
        <HistoryView onOpen={(id) => router.push(`/history/${id}`)} />
      );
    }
    if (view === "settings") return <SettingsView theme={theme} onThemeChange={setTheme} />;
    if (view === "help") return <HelpView />;
    if (view === "profile") return <ProfileView key={profile?.id || "profile-loading"} profile={profile} onProfileChange={setProfile} />;
    return renderAnalyzer();
  };

  if (!authReady)
    return (
      <div className="grid min-h-screen place-items-center bg-canvas">
        <p className="text-base text-muted">Checking your sign-in…</p>
      </div>
    );

  return (
    <div className="grid-texture min-h-screen lg:flex">
      <ProductSidebar activeView={view} mobileOpen={mobileOpen} profile={profile} onNavigate={navigate} onMobileToggle={setMobileOpen} />
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-line bg-surface/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3">
            <BrandMark compact />
            <div>
              <p className="text-[14px] font-extrabold tracking-[0.15em] text-ink">SOCIALCRAFT</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">Content intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <MobileMenuButton onClick={() => setMobileOpen(true)} />
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-64px)] max-w-[1400px] px-4 pb-10 pt-3 sm:px-7 sm:pt-5 lg:min-h-screen lg:px-10 xl:px-14">
          <div className="mb-2 hidden justify-end lg:flex">
            <ThemeToggle />
          </div>
          {renderView()}
        </main>
        <footer className="border-t border-line bg-surface">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-7 lg:px-10 xl:px-14">
            <span>SocialCraft · A focused content review workspace</span>
            <span>Your analyses are saved securely to your account.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
