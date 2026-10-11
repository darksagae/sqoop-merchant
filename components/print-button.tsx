'use client'

export function PrintButton({ children }: { children: React.ReactNode }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-secondary print:hidden">
      {children}
    </button>
  )
}
