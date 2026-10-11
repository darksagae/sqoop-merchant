import type { z } from 'zod'
import { UserError } from '../errors'
import { fieldErrors } from '../validation'

export type FormState = { error?: string; fields?: Record<string, string>; values?: Record<string, string> } | undefined

export function values(form: FormData) {
  const result: Record<string, string> = {}
  for (const [key, value] of form) if (typeof value === 'string' && key !== 'password') result[key] = value
  return result
}

export function invalid(form: FormData, error: z.ZodError): FormState {
  const fields = fieldErrors(error)
  return { error: fields.form ?? 'Please check the highlighted fields.', fields, values: values(form) }
}

/** Turns expected errors into form state; lets anything else (incl. redirects) propagate. */
export function failure(form: FormData, error: unknown): FormState {
  if (error instanceof UserError) return { error: error.message, values: values(form) }
  throw error
}
