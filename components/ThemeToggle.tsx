"use client";

import { Moon, Palette, Sun, Sunset } from "lucide-react";
import { useTheme, type ThemeName } from "@/components/ThemeProvider";

const labels: Record<ThemeName, string> = { sunrise: "Sunrise", sunset: "Sunset", midnight: "MidNight" };
const icons = { sunrise: Sun, sunset: Sunset, midnight: Moon };

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const nextTheme = theme === "sunrise" ? "sunset" : theme === "sunset" ? "midnight" : "sunrise";
  const Icon = icons[theme];
  return <button type="button" className="theme-toggle" onClick={() => setTheme(nextTheme)} aria-label={`${labels[theme]} theme. Switch to ${labels[nextTheme]} theme.`} title={`${labels[theme]} theme · switch to ${labels[nextTheme]}`}><Icon aria-hidden="true" className="h-4 w-4" /><span>{labels[theme]}</span></button>;
}

export function ThemeSwatch({ theme }: { theme: ThemeName }) {
  const Icon = icons[theme];
  return <span className={`theme-swatch theme-swatch-${theme}`} aria-hidden="true"><Icon className="h-5 w-5" /></span>;
}

export function ThemeIcon() {
  const { theme } = useTheme();
  const Icon = icons[theme] || Palette;
  return <Icon aria-hidden="true" className="h-4 w-4" />;
}
