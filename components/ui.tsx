import type { OrderStatus } from '@/lib/repo/orders'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: 'bg-amber-500/12 text-amber-700 ring-amber-600/20 dark:text-amber-300',
  paid: 'bg-sky-500/12 text-sky-700 ring-sky-600/20 dark:text-sky-300',
  fulfilled: 'bg-emerald-500/12 text-emerald-700 ring-emerald-600/20 dark:text-emerald-300',
  cancelled: 'bg-zinc-500/12 text-zinc-600 ring-zinc-500/20 dark:text-zinc-300',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${STATUS_STYLE[status]}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  )
}

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'warn' | 'brand'
  children: React.ReactNode
}) {
  const style = {
    neutral: 'bg-sunken text-ink-soft',
    warn: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
    brand: 'bg-brand-soft text-brand-strong',
  }[tone]
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}>{children}</span>
}

export function Empty({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode
  title: string
  body: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand-strong">{icon}</span>
      <h2 className="mt-4 font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-ink-soft">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Field({
  label,
  name,
  error,
  hint,
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; error?: string; hint?: string }) {
  const id = props.id ?? `field-${name}`
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className="input"
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-semibold text-bad">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-soft">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

export function FormMessage({ error, ok }: { error?: string; ok?: string }) {
  if (error) {
    return (
      <p role="alert" className="rounded-xl bg-bad-soft px-4 py-3 text-sm font-semibold text-bad">
        {error}
      </p>
    )
  }
  if (ok) {
    return (
      <p role="status" className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-good">
        {ok}
      </p>
    )
  }
  return null
}
