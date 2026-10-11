import { LogOut, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { AppNav } from '@/components/app-nav'
import { Logo } from '@/components/logo'
import { signOut } from '@/lib/actions/auth'
import { requireUser } from '@/lib/auth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const initials = user.name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 z-30 bg-nav lg:h-dvh print:hidden">
        <div className="flex h-16 items-center justify-between px-5 lg:h-auto lg:flex-col lg:items-stretch lg:gap-6 lg:py-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/app" className="shrink-0 rounded-lg">
              <Logo inverted />
            </Link>
            <span className="truncate border-l border-white/15 pl-3 text-sm font-semibold text-nav-ink lg:hidden">
              {user.workspaceName}
            </span>
          </div>
          <div className="hidden rounded-xl bg-nav-active px-3 py-2.5 lg:block">
            <p className="truncate text-sm font-semibold text-white">{user.workspaceName}</p>
            <p className="text-xs text-nav-ink capitalize">{user.role}</p>
          </div>
          <form action={signOut} className="lg:hidden">
            <button className="btn min-h-9 px-3 text-nav-ink hover:text-white" aria-label="Sign out">
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          </form>
        </div>
        <div className="lg:hidden">
          <AppNav variant="bar" />
        </div>
        <div className="hidden px-3 lg:block">
          <AppNav variant="sidebar" />
        </div>
        <div className="absolute inset-x-0 bottom-0 hidden border-t border-white/10 p-4 lg:block">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="truncate text-xs text-nav-ink">{user.isDemo ? 'Demo account' : user.email}</p>
            </div>
            <form action={signOut}>
              <button
                className="grid size-9 cursor-pointer place-items-center rounded-lg text-nav-ink hover:bg-nav-active hover:text-white"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="size-4" aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        {user.isDemo && (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-brand-soft px-4 py-2.5 text-center text-sm text-brand-strong print:hidden">
            <Sparkles className="size-4" aria-hidden="true" />
            <span>You’re exploring a demo shop with sample data.</span>
            <Link href="/signup" className="font-bold underline underline-offset-2">
              Create your own workspace
            </Link>
          </div>
        )}
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  )
}
