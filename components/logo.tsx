export function LogoMark({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="11" className="fill-ink dark:fill-surface" />
      <path
        d="M27 13.5c-1.6-1.7-4-2.5-6.6-2.5-4 0-6.9 2-6.9 5.1 0 6.6 13 3.9 13 9.6 0 2.6-2.6 4.3-6.4 4.3-2.9 0-5.4-1-7.1-2.8"
        fill="none"
        className="stroke-brand"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className={`text-lg font-extrabold tracking-tight ${inverted ? 'text-white' : ''}`}>
        sqoop<span className="text-brand">.</span>
      </span>
    </span>
  )
}
