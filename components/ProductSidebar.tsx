"use client";

import { CircleHelp, History, LayoutDashboard, Menu, Settings, ScanText, UserRound, X } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { AnalysisSectionNav } from "@/components/AnalysisSectionNav";

export type ProductView = "dashboard" | "analyze" | "history" | "settings" | "help" | "profile";
export type ProfileSummary = { displayName: string | null; email: string | null; avatarUrl: string | null };

type Props = {
  activeView: ProductView;
  mobileOpen: boolean;
  profile?: ProfileSummary | null;
  showAnalysisNav?: boolean;
  onNavigate: (view: ProductView) => void;
  onMobileToggle: (open: boolean) => void;
};

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "analyze", label: "Analyze", icon: ScanText },
  { id: "history", label: "History", icon: History },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "help", label: "Help", icon: CircleHelp },
] as const;

function Navigation({ activeView, onNavigate, onMobileToggle }: Omit<Props, "mobileOpen" | "profile" | "showAnalysisNav">) {
  return (
    <nav aria-label="Primary navigation" className="space-y-1">
      {navigation.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => {
            onNavigate(id);
            onMobileToggle(false);
          }}
          aria-current={activeView === id ? "page" : undefined}
          className={`nav-item ${activeView === id ? "nav-item-active" : ""}`}
        >
          <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function ProfileButton({
  activeView,
  profile,
  onNavigate,
  onMobileToggle,
}: {
  activeView: ProductView;
  profile?: ProfileSummary | null;
  onNavigate: (view: ProductView) => void;
  onMobileToggle: (open: boolean) => void;
}) {
  const label = profile?.displayName || profile?.email?.split("@")[0] || "Your Profile";
  return (
    <button
      type="button"
      onClick={() => {
        onNavigate("profile");
        onMobileToggle(false);
      }}
      aria-current={activeView === "profile" ? "page" : undefined}
      className={`profile-nav ${activeView === "profile" ? "profile-nav-active" : ""}`}
    >
      <span className="profile-avatar">
        {profile?.avatarUrl ? (
          <span
            className="profile-avatar-image"
            style={{ backgroundImage: "url(" + profile.avatarUrl + ")" }}
            role="img"
            aria-label="Profile picture"
          />
        ) : (
          <UserRound aria-hidden="true" className="h-4 w-4" />
        )}
      </span>
      <span className="min-w-0 text-left">
        <span className="block truncate text-sm font-bold">{label}</span>
        <span className="mt-0.5 block text-xs text-muted">Your Profile</span>
      </span>
    </button>
  );
}

function SidebarContent({ activeView, profile, showAnalysisNav, onNavigate, onMobileToggle }: Omit<Props, "mobileOpen">) {
  return (
    <>
      <div className="mb-5 flex items-center gap-3 px-2">
        <BrandMark />
        <div>
          <p className="text-[14px] font-extrabold tracking-[0.16em] text-ink">SOCIALCRAFT</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Content intelligence</p>
        </div>
      </div>
      <Navigation activeView={activeView} onNavigate={onNavigate} onMobileToggle={onMobileToggle} />
      {showAnalysisNav && (
        <div className="mt-5 border-t border-line pt-4">
          <AnalysisSectionNav onNavigate={() => onMobileToggle(false)} />
        </div>
      )}
      <div className="mt-auto space-y-3 border-t border-line pt-4">
        <div className="px-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Account</p>
        </div>
        <ProfileButton activeView={activeView} profile={profile} onNavigate={onNavigate} onMobileToggle={onMobileToggle} />
        <div className="rounded-xl border border-line bg-canvas p-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">Private workspace</p>
          <p className="mt-1 text-xs leading-5 text-muted">Your analyses are saved securely to your account.</p>
        </div>
      </div>
    </>
  );
}

export function ProductSidebar({ activeView, mobileOpen, profile, showAnalysisNav, onNavigate, onMobileToggle }: Props) {
  return (
    <>
      <aside
        className="hidden w-[250px] shrink-0 overflow-y-auto border-r border-line bg-surface px-4 py-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col"
        aria-label="Product navigation"
      >
        <SidebarContent activeView={activeView} profile={profile} showAnalysisNav={showAnalysisNav} onNavigate={onNavigate} onMobileToggle={onMobileToggle} />
      </aside>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-deep/35 lg:hidden"
          aria-label="Close navigation menu"
          onClick={() => onMobileToggle(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(84vw,310px)] flex-col border-r border-line bg-surface px-5 py-6 shadow-2xl transition-transform duration-200 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Mobile product navigation"
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="text-[14px] font-extrabold tracking-[0.16em] text-ink">SOCIALCRAFT</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Content intelligence</p>
            </div>
          </div>
          <button type="button" className="icon-button" aria-label="Close navigation menu" onClick={() => onMobileToggle(false)}>
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent activeView={activeView} profile={profile} showAnalysisNav={showAnalysisNav} onNavigate={onNavigate} onMobileToggle={onMobileToggle} />
      </aside>
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="icon-button" aria-label="Open navigation menu" onClick={onClick}>
      <Menu aria-hidden="true" className="h-5 w-5" />
    </button>
  );
}
