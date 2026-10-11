import Link from 'next/link'
import { Logo } from '@/components/logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center px-5 py-10">
      <Link href="/" className="rounded-lg" aria-label="Sqoop home">
        <Logo />
      </Link>
      <div className="card mt-8 w-full max-w-sm p-6 sm:p-8">{children}</div>
    </main>
  )
}
