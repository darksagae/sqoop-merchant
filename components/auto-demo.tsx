'use client'

import { useEffect, useRef } from 'react'
import { startDemo } from '@/lib/actions/auth'
import { SubmitButton } from './submit-button'

// Starts the demo as soon as the page loads. It is a POST, so crawlers and link previews never create shops.
export function AutoDemo() {
  const form = useRef<HTMLFormElement>(null)
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    form.current?.requestSubmit()
  }, [])
  return (
    <form ref={form} action={startDemo} className="mt-6">
      <SubmitButton className="btn btn-primary w-full" pending="Setting up demo…">
        Open the demo shop
      </SubmitButton>
    </form>
  )
}
