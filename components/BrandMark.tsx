export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand-mark ${compact ? "brand-mark-compact" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6.5C13.8 6.5 10.5 10.8 12.8 16C15 21.2 21 21.2 23.2 16C25.5 10.8 22.2 6.5 18 6.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M9.8 20.5C7.7 16.8 11.3 12.5 16.5 13.8C21.7 15 21.7 22.2 16.5 23.4C11.3 24.6 7.7 20.5 9.8 20.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M26.2 20.5C28.3 16.8 24.7 12.5 19.5 13.8C14.3 15 14.3 22.2 19.5 23.4C24.7 24.6 28.3 20.5 26.2 20.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="18" cy="11" r="1.75" fill="currentColor" />
        <circle cx="12.5" cy="20.5" r="1.75" fill="currentColor" />
        <circle cx="23.5" cy="20.5" r="1.75" fill="currentColor" />
        <circle cx="18" cy="17" r="2.25" fill="currentColor" />
      </svg>
    </span>
  );
}
