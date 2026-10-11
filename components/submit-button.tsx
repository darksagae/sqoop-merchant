'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton({
  children,
  pending,
  className = 'btn btn-primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pending?: string }) {
  const status = useFormStatus()
  return (
    <button type="submit" disabled={status.pending || props.disabled} className={className} {...props}>
      {status.pending && pending ? pending : children}
    </button>
  )
}
