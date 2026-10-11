'use client'

import { CreditCard, LayoutDashboard, Package, ReceiptText, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const NAV = [
  { href: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/orders', label: 'Orders', icon: ReceiptText },
  { href: '/app/products', label: 'Products', icon: Package },
  { href: '/app/settings', label: 'Stores & team', icon: Settings },
  { href: '/app/billing', label: 'Billing', icon: CreditCard },
]

export function AppNav({ variant }: { variant: 'sidebar' | 'bar' }) {
  const pathname = usePathname()
  const isActive = (href: string) => (href === '/app' ? pathname === href : pathname.startsWith(href))
  if (variant === 'bar') {
    return (
      <nav aria-label="App" className="flex gap-1 overflow-x-auto px-3 pb-2">
        {NAV.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? 'page' : undefined}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold ${
              isActive(href) ? 'bg-nav-active text-white' : 'text-nav-ink'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    )
  }
  return (
    <nav aria-label="App" className="space-y-1">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? 'page' : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
            isActive(href) ? 'bg-nav-active text-white' : 'text-nav-ink hover:bg-nav-active/60 hover:text-white'
          }`}
        >
          <Icon className={`size-[18px] ${isActive(href) ? 'text-brand' : ''}`} aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
