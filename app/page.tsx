import {
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  Check,
  PackageSearch,
  Printer,
  ReceiptText,
  ShieldCheck,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { PricingCalculator } from '@/components/pricing-calculator'
import { SubmitButton } from '@/components/submit-button'
import { startDemo } from '@/lib/actions/auth'
import { currentUser } from '@/lib/auth'

const FEATURES = [
  {
    icon: ReceiptText,
    title: 'Orders in seconds',
    body: 'Search, tap and sell. Record cash, mobile money or card, and print a receipt.',
  },
  {
    icon: PackageSearch,
    title: 'Stock that keeps itself',
    body: 'Every sale takes stock out; every cancellation puts it back. No more counting at night.',
  },
  {
    icon: Bell,
    title: 'Low-stock alerts',
    body: 'Set a reorder level per product and see what to restock before you run out.',
  },
  { icon: Building2, title: 'Every branch, one view', body: 'Add stores and see sales by location, side by side.' },
  {
    icon: Users,
    title: 'Staff accounts',
    body: 'Give each person their own login. Owners keep control of the team and settings.',
  },
  {
    icon: BarChart3,
    title: 'Know your numbers',
    body: 'Revenue, average order and best sellers — updated the moment you sell.',
  },
]

const FAQ = [
  {
    q: 'Do I need a computer?',
    a: 'No. Sqoop works in any modern browser on a phone, tablet or laptop.',
  },
  {
    q: 'How is my data kept separate from other shops?',
    a: 'Every record belongs to one workspace, and every query is scoped to the signed-in workspace. Passwords are hashed with scrypt and sessions are stored only as hashes.',
  },
  {
    q: 'Can I take payments through Sqoop?',
    a: 'Not yet. You record how a customer paid — cash, mobile money or card — and Sqoop keeps the books. Payment collection is on the roadmap.',
  },
  {
    q: 'What happens if I go over my allowance?',
    a: 'Nothing stops working. Extra stores, team members and orders are simply added to the next bill at the published rates.',
  },
]

export default async function Home({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const user = await currentUser()
  const demoBusy = (await searchParams).demo === 'busy'

  return (
    <div className="overflow-x-clip">
      <header className="mx-auto flex h-18 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="rounded-lg" aria-label="Sqoop home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <a href="#pricing" className="btn btn-ghost hidden sm:inline-flex">
            Pricing
          </a>
          {user ? (
            <Link href="/app" className="btn btn-primary">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">
                Sign in
              </Link>
              <Link href="/signup" className="btn btn-primary">
                Start free
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:pt-20">
        <div
          aria-hidden="true"
          className="absolute top-10 -right-40 -z-10 size-[36rem] rounded-full bg-brand/15 blur-3xl"
        />
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold">
            <span className="size-1.5 rounded-full bg-brand" /> Built for shops in Uganda · priced in UGX
          </span>
          <h1 className="mt-6 text-5xl leading-[1.02] font-extrabold tracking-tight sm:text-6xl">
            Sell more.
            <br />
            <span className="text-brand-strong">Count less.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-ink-soft">
            Sqoop is the simple back office for growing shops: take orders, keep stock right and see sales across every
            branch — from your phone.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="btn btn-primary min-h-12 px-6 text-base">
              Start free <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <form action={startDemo}>
              <SubmitButton className="btn btn-secondary min-h-12 px-6 text-base" pending="Setting up demo…">
                Explore the live demo
              </SubmitButton>
            </form>
          </div>
          {demoBusy && (
            <p role="alert" className="mt-3 text-sm font-semibold text-bad">
              Too many demos from this network right now. Please try again later.
            </p>
          )}
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
            {['No card needed', 'Works on any phone', 'Your data stays separate'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check className="size-4 text-good" strokeWidth={3} aria-hidden="true" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <DashboardPreview />
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">Everything a busy counter needs</h2>
          <p className="mt-3 max-w-xl text-ink-soft">No training days. If you can send a message, you can run Sqoop.</p>
          <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title}>
                <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand-strong">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-20 sm:px-6">
        <div className="max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">One plan. Pay for what you use.</h2>
          <p className="mt-3 text-ink-soft">
            Move the sliders to see exactly what you would pay. No tiers, no surprises.
          </p>
        </div>
        <div className="mt-10">
          <PricingCalculator />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Questions</h2>
            <p className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
              <ShieldCheck className="size-4 text-good" aria-hidden="true" /> Prototype: no real payments are taken.
            </p>
          </div>
          <dl className="divide-y divide-line border-y border-line">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="py-5">
                <dt className="font-semibold">{q}</dt>
                <dd className="mt-1.5 text-sm text-ink-soft">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-ink-soft sm:px-6">
          <Logo />
          <p>Built for Galuxium Nexus V2 · MIT licensed</p>
        </div>
      </footer>
    </div>
  )
}

function DashboardPreview() {
  const bars = [38, 52, 44, 61, 49, 72, 58, 66, 81, 64, 77, 90]
  return (
    <div aria-hidden="true" className="relative select-none">
      <div className="card overflow-hidden shadow-[0_40px_80px_-40px_rgb(21_22_28/0.45)]">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="ml-3 text-xs text-ink-soft">sqoop · Dashboard</span>
        </div>
        <div className="grid grid-cols-3 gap-3 p-4">
          {[
            ['Revenue this month', 'UGX 4.8M'],
            ['Paid orders', '326'],
            ['Average order', 'UGX 14,700'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-line p-3">
              <p className="text-[0.65rem] font-semibold text-ink-soft">{label}</p>
              <p className="num mt-1 text-sm font-bold sm:text-base">{value}</p>
            </div>
          ))}
        </div>
        <div className="px-4 pb-4">
          <div className="flex h-36 items-end gap-1.5 rounded-xl border border-line p-3">
            {bars.map((h, i) => (
              <span
                key={i}
                className={`flex-1 rounded-t ${i === bars.length - 1 ? 'bg-brand' : 'bg-ink/80 dark:bg-ink/50'}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="card absolute -bottom-6 -left-4 w-60 p-4 shadow-xl sm:-left-10">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold">Order #1284</span>
          <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 font-semibold text-emerald-700 dark:text-emerald-300">
            Paid
          </span>
        </div>
        <p className="mt-2 text-xs text-ink-soft">Sugar 1 kg × 2 · Cooking oil 1 L</p>
        <p className="num mt-1 font-bold">UGX 17,500</p>
      </div>
      <div className="card absolute -top-5 -right-2 flex items-center gap-2 px-3 py-2 text-xs font-semibold shadow-lg sm:-right-6">
        <Printer className="size-4 text-brand" /> Receipt printed
      </div>
    </div>
  )
}
