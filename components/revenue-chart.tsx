import { compact, ugx } from '@/lib/money'

type Day = { day: string; revenue: number; orders: number }

const label = (day: string) =>
  new Intl.DateTimeFormat('en-UG', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(day))

export function RevenueChart({ data }: { data: Day[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1)
  const ticks = [max, max / 2, 0]
  return (
    <figure>
      <div className="flex gap-3">
        <div className="num flex h-48 flex-col justify-between pb-6 text-right text-[0.7rem] text-ink-soft">
          {ticks.map((t) => (
            <span key={t}>{compact(Math.round(t))}</span>
          ))}
        </div>
        <ol className="relative flex h-48 flex-1 items-end gap-1.5 sm:gap-2" aria-label="Revenue per day, last 14 days">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between"
          >
            {ticks.map((t) => (
              <span key={t} className="border-t border-dashed border-line" />
            ))}
          </div>
          {data.map((d, index) => {
            const isToday = index === data.length - 1
            return (
              <li key={d.day} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                <span className="sr-only">
                  {label(d.day)}: {ugx(d.revenue)} from {d.orders} orders
                </span>
                <span
                  aria-hidden="true"
                  className={`relative w-full max-w-9 rounded-t-md transition-colors ${
                    isToday ? 'bg-brand' : 'bg-ink/80 group-hover:bg-brand dark:bg-ink/60'
                  }`}
                  style={{ height: `calc((100% - 1.5rem) * ${d.revenue / max})`, minHeight: d.revenue ? 3 : 0 }}
                />
                <span
                  aria-hidden="true"
                  className="num pointer-events-none absolute bottom-[calc(100%+0.25rem)] z-10 hidden rounded-lg bg-ink px-2.5 py-1.5 text-xs whitespace-nowrap text-canvas group-hover:block"
                >
                  {label(d.day)} · {ugx(d.revenue)}
                </span>
                <span aria-hidden="true" className="mt-2 h-4 text-[0.65rem] text-ink-soft">
                  {index % 2 === data.length % 2 ? '' : label(d.day).split(' ')[0]}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </figure>
  )
}
