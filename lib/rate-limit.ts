// Fixed-window, in-memory limiter. Per server instance only; use a shared
// store such as Redis when running more than one instance.
const windows = new Map<string, { count: number; resetAt: number }>()

/** Returns true if the action is allowed. */
export function allow(key: string, limit: number, windowMs: number) {
  const time = Date.now()
  const current = windows.get(key)
  if (!current || current.resetAt <= time) {
    windows.set(key, { count: 1, resetAt: time + windowMs })
    if (windows.size > 10_000) for (const [k, w] of windows) if (w.resetAt <= time) windows.delete(k)
    return true
  }
  current.count += 1
  return current.count <= limit
}
