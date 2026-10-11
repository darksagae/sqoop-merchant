import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-extrabold text-brand">404</p>
      <h1 className="mt-3 text-2xl font-bold">We couldn’t find that page</h1>
      <p className="mt-2 text-ink-soft">It may have been removed, or it belongs to another workspace.</p>
      <Link href="/app" className="btn btn-primary mt-6">
        Back to dashboard
      </Link>
    </div>
  )
}
