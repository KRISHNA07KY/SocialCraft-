"use client";

import { ArrowRight, Eye, EyeOff, Mail, MessageSquareText } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword, FacebookAuthProvider, GoogleAuthProvider, onAuthStateChanged, RecaptchaVerifier, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signInWithPhoneNumber, TwitterAuthProvider, type ConfirmationResult, type User } from "firebase/auth";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { firebaseAuth } from "@/lib/firebase/client";

const comingSoonProviders = ["Instagram", "LinkedIn", "Snapchat", "YouTube", "Telegram"];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(searchParams.get("error") || "");
  const [success, setSuccess] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const recaptcha = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => onAuthStateChanged(firebaseAuth, (user: User | null) => {
    if (user) router.replace("/dashboard");
  }), [router]);

  const firebaseError = (error: unknown) => {
    const code = (error as { code?: string })?.code;
    const messages: Record<string, string> = {
      "auth/invalid-credential": "That email or password is incorrect.",
      "auth/operation-not-allowed": "Email/password sign-in is disabled. Enable it in Firebase Console → Authentication → Sign-in method.",
      "auth/invalid-email": "Enter a valid email address.",
      "auth/email-already-in-use": "An account already exists for that email.",
      "auth/weak-password": "Choose a stronger password with at least 6 characters.",
      "auth/popup-closed-by-user": "The sign-in window was closed before completion.",
      "auth/cancelled-popup-request": "The sign-in window was closed before completion.",
      "auth/account-exists-with-different-credential": "An account already exists with this email using a different sign-in method.",
      "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
      "auth/invalid-verification-code": "That verification code is not valid.",
      "auth/code-expired": "That verification code expired. Send a new one.",
      "auth/invalid-phone-number": "Enter a valid phone number in international format, e.g. +15551234567.",
      "auth/missing-phone-number": "Enter your phone number with a country code first.",
      "auth/quota-exceeded": "The SMS quota for this project has been reached. Try again later.",
      "auth/captcha-check-failed": "The reCAPTCHA check failed. Refresh the page and try again.",
      "auth/network-request-failed": "A network error occurred. Check your connection and try again.",
    };
    return (code && messages[code]) || (error instanceof Error ? error.message : "Authentication failed. Please try again.");
  };

  const submitEmail = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage(""); setSuccess("");
    try {
      if (mode === "signIn") await signInWithEmailAndPassword(firebaseAuth, email, password);
      else await createUserWithEmailAndPassword(firebaseAuth, email, password);
      setSuccess("Signed in. Redirecting to your workspace…");
      router.replace("/dashboard");
    } catch (error) { setMessage(firebaseError(error)); }
    setBusy(false);
  };

  const resetPassword = async () => {
    setMessage(""); setSuccess("");
    if (!email) { setMessage("Enter your email first, then choose forgot password."); return; }
    try { await sendPasswordResetEmail(firebaseAuth, email); setSuccess("If that email exists, you’ll receive reset instructions shortly."); } catch (error) { setMessage(firebaseError(error)); }
  };

  const signInWithGoogle = async () => {
    setBusy(true); setMessage("");
    try { await signInWithPopup(firebaseAuth, new GoogleAuthProvider()); router.replace("/dashboard"); } catch (error) { setMessage(firebaseError(error)); }
    setBusy(false);
  };

  const signInWithFacebook = async () => {
    setBusy(true); setMessage("");
    try { await signInWithPopup(firebaseAuth, new FacebookAuthProvider()); router.replace("/dashboard"); } catch (error) { setMessage(firebaseError(error)); }
    setBusy(false);
  };

  const signInWithTwitter = async () => {
    setBusy(true); setMessage("");
    try { await signInWithPopup(firebaseAuth, new TwitterAuthProvider()); router.replace("/dashboard"); } catch (error) { setMessage(firebaseError(error)); }
    setBusy(false);
  };

  const sendPhoneCode = async () => {
    setMessage(""); setSuccess("");
    if (!phone) { setMessage("Enter your phone number with a country code first."); return; }
    setBusy(true);
    try {
      if (!recaptcha.current) recaptcha.current = new RecaptchaVerifier(firebaseAuth, "recaptcha-container", { size: "invisible" });
      setConfirmation(await signInWithPhoneNumber(firebaseAuth, phone, recaptcha.current));
      setOtpSent(true); setSuccess("A verification code was sent to your phone.");
    } catch (error) { setMessage(firebaseError(error)); recaptcha.current?.clear(); recaptcha.current = null; }
    setBusy(false);
  };

  const verifyPhoneCode = async () => {
    if (!confirmation) return;
    setBusy(true); setMessage("");
    try { await confirmation.confirm(otp); router.replace("/dashboard"); } catch (error) { setMessage(firebaseError(error)); }
    setBusy(false);
  };

  const cancelPhoneVerification = () => {
    setOtpSent(false); setOtp(""); setConfirmation(null); setMessage(""); setSuccess("");
    recaptcha.current?.clear(); recaptcha.current = null;
  };

  return <main className="grid min-h-screen bg-canvas lg:grid-cols-[.9fr_1.1fr]"><section className="grid-texture hidden place-items-center p-8 lg:grid"><div className="max-w-md"><div className="flex items-center gap-3"><BrandMark /><div><p className="text-sm font-extrabold tracking-[0.18em] text-ink">SOCIALCRAFT</p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Content intelligence</p></div></div><p className="editorial-display mt-14 text-4xl font-bold leading-tight tracking-[-0.03em] text-ink xl:text-5xl">Keep the thinking.<br /><span className="text-primary">Lose the noise.</span></p><p className="mt-5 max-w-sm text-base leading-7 text-muted">Save your editorial briefs, revisit your drafts, and keep building a stronger point of view.</p></div></section><section className="relative flex min-h-screen items-center justify-center px-5 py-8 sm:px-8"><div className="absolute right-5 top-5 sm:right-8 sm:top-8"><ThemeToggle /></div><div className="w-full max-w-md"><div className="mb-6 flex items-center gap-3 lg:hidden"><BrandMark compact /><div><p className="text-[14px] font-extrabold tracking-[0.15em] text-ink">SOCIALCRAFT</p><p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted">Content intelligence</p></div></div><div className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-coral">YOUR EDITORIAL WORKSPACE</p><h1 className="editorial-display mt-2 text-3xl font-bold leading-tight tracking-[-0.03em] text-ink sm:text-4xl">Welcome back to SocialCraft.</h1><p className="mt-3 text-base leading-7 text-muted">Sign in to save your analyses, revisit your work, and keep improving your content.</p></div><form onSubmit={submitEmail} className="space-y-4"><label className="field-label">Email<input className="field-input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" /></label><label className="field-label">Password<span className="relative block"><input className="field-input pr-11" type={showPassword ? "text" : "password"} autoComplete={mode === "signIn" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required placeholder="At least 6 characters" /><button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}</button></span></label><button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:cursor-wait disabled:opacity-60">{busy ? "Working…" : mode === "signIn" ? <>Sign in <ArrowRight aria-hidden="true" className="h-4 w-4" /></> : "Create account"}</button></form><div className="mt-4 flex items-center justify-between text-sm"><button type="button" className="font-semibold text-primary hover:underline" onClick={() => setMode((current) => current === "signIn" ? "signUp" : "signIn")}>{mode === "signIn" ? "Create an account" : "Already have an account? Sign in"}</button>{mode === "signIn" && <button type="button" className="font-semibold text-muted hover:text-ink" onClick={resetPassword}>Forgot password?</button>}</div>{(message || success) && <p className={`mt-4 rounded-xl border px-4 py-3 text-sm ${message ? "surface-warning" : "border-primary/25 bg-surface-secondary text-ink"}`} role="status">{message || success}</p>}<div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-muted"><span className="h-px flex-1 bg-line" />Or continue with<span className="h-px flex-1 bg-line" /></div><div className="grid gap-3 sm:grid-cols-2"><button type="button" disabled={busy} onClick={signInWithGoogle} className="provider-button"><Mail aria-hidden="true" className="h-4 w-4" />Google</button><button type="button" disabled={busy || otpSent} onClick={sendPhoneCode} className="provider-button"><MessageSquareText aria-hidden="true" className="h-4 w-4" />{busy && !otpSent ? "Sending…" : "Phone OTP"}</button><button type="button" disabled={busy} onClick={signInWithFacebook} className="provider-button">Facebook</button><button type="button" disabled={busy} onClick={signInWithTwitter} className="provider-button">X / Twitter</button>{comingSoonProviders.map((provider) => <button key={provider} type="button" disabled className="provider-button provider-disabled">{provider}<span>Coming soon</span></button>)}</div>{otpSent && <div className="mt-4 rounded-xl border border-line bg-surface-secondary p-4"><label className="field-label">Verification code<input className="field-input" inputMode="numeric" value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="123456" /></label><div className="mt-3 flex gap-2"><button type="button" onClick={verifyPhoneCode} disabled={busy || !otp} className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "Verifying…" : "Verify phone"}</button><button type="button" onClick={cancelPhoneVerification} disabled={busy} className="secondary-button px-4 py-3 text-sm">Cancel</button></div></div>}<div id="recaptcha-container" /><p className="mt-6 text-center text-xs leading-5 text-muted">By continuing, you agree to use SocialCraft for content review and analysis.</p></div></section></main>;
}

export default function LoginPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center bg-canvas"><p className="text-base text-muted">Loading sign-in…</p></main>}><LoginContent /></Suspense>;
}
