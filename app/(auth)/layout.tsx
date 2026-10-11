import { Check } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/logo'

const POINTS = ['Stock that updates as you sell', 'Sales for every branch in one place', 'Clear pricing in shillings']

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <div className="relative hidden overflow-hidden bg-nav p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="absolute -right-32 -bottom-32 size-[30rem] rounded-full bg-brand/25 blur-3xl"
        />
        <Link href="/" className="relative w-fit rounded-lg">
          <Logo inverted />
        </Link>
        <div className="relative">
          <p className="max-w-md text-4xl leading-tight font-bold tracking-tight">
            The simple back office for growing shops.
          </p>
          <ul className="mt-8 space-y-3 text-nav-ink">
            {POINTS.map((point) => (
              <li key={point} className="flex items-center gap-3">
                <span className="grid size-6 place-items-center rounded-full bg-brand/20 text-brand">
                  <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-nav-ink">Built for merchants in Uganda.</p>
      </div>
      <main className="flex flex-col px-5 py-8 sm:px-10">
        <Link href="/" className="w-fit rounded-lg lg:hidden">
          <Logo />
        </Link>
        <div className="mx-auto my-auto w-full max-w-sm py-10">{children}</div>
      </main>
    </div>
  )
}
