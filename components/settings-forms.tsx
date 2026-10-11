'use client'

import { Pencil, Trash2, UserPlus } from 'lucide-react'
import { useActionState, useState } from 'react'
import { deleteMember, inviteMember, saveStore, saveWorkspace } from '@/lib/actions/settings'
import type { FormState } from '@/lib/actions/state'
import { Field, FormMessage } from './ui'
import { SubmitButton } from './submit-button'

export function WorkspaceForm({ name, canEdit }: { name: string; canEdit: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(saveWorkspace, undefined)
  return (
    <form action={action} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field
          label="Business name"
          name="name"
          defaultValue={state?.values?.name ?? name}
          error={state?.fields?.name}
          disabled={!canEdit}
          className="flex-1"
          maxLength={80}
        />
        {canEdit && <SubmitButton pending="Saving…">Save</SubmitButton>}
      </div>
      <FormMessage error={state?.fields ? undefined : state?.error} ok={state?.values?.ok} />
    </form>
  )
}

export function StoreForm({
  store,
  onDone,
}: {
  store?: { id: string; name: string; location: string }
  onDone?: () => void
}) {
  const [state, action] = useActionState<FormState, FormData>(async (prev: FormState, form: FormData) => {
    const result = await saveStore(store?.id ?? null, prev, form)
    if (result?.values?.ok && onDone) onDone()
    return result
  }, undefined)
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <Field
        label="Store name"
        name="name"
        id={`store-name-${store?.id ?? 'new'}`}
        defaultValue={store?.name}
        error={state?.fields?.name}
        maxLength={80}
        required
      />
      <Field
        label="Location"
        name="location"
        id={`store-location-${store?.id ?? 'new'}`}
        defaultValue={store?.location}
        error={state?.fields?.location}
        placeholder="e.g. Ntinda"
        maxLength={120}
      />
      <SubmitButton pending="Saving…">{store ? 'Save' : 'Add store'}</SubmitButton>
      {(state?.error && !state.fields) || state?.values?.ok ? (
        <div className="sm:col-span-3">
          <FormMessage error={state?.fields ? undefined : state?.error} ok={store ? undefined : state?.values?.ok} />
        </div>
      ) : null}
    </form>
  )
}

export function StoreRow({ store }: { store: { id: string; name: string; location: string; orderCount: number } }) {
  const [editing, setEditing] = useState(false)
  if (editing) {
    return (
      <li className="px-5 py-4">
        <StoreForm store={store} onDone={() => setEditing(false)} />
      </li>
    )
  }
  return (
    <li className="flex items-center gap-4 px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{store.name}</p>
        <p className="text-sm text-ink-soft">
          {store.location || 'No location'} · {store.orderCount} orders
        </p>
      </div>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => setEditing(true)}
        aria-label={`Edit ${store.name}`}
      >
        <Pencil className="size-4" aria-hidden="true" /> Edit
      </button>
    </li>
  )
}

export function MemberForm() {
  const [state, action] = useActionState<FormState, FormData>(inviteMember, undefined)
  const [open, setOpen] = useState(false)
  if (!open) {
    return (
      <button type="button" className="btn btn-secondary" onClick={() => setOpen(true)}>
        <UserPlus className="size-4" aria-hidden="true" /> Add team member
      </button>
    )
  }
  return (
    <form action={action} className="space-y-4 rounded-2xl bg-sunken p-4" key={state?.values?.ok}>
      <FormMessage error={state?.fields ? undefined : state?.error} ok={state?.values?.ok} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Name" name="name" defaultValue={state?.values?.name} error={state?.fields?.name} maxLength={80} />
        <Field
          label="Email"
          name="email"
          type="email"
          defaultValue={state?.values?.email}
          error={state?.fields?.email}
          autoComplete="off"
        />
        <Field
          label="Temporary password"
          name="password"
          type="password"
          error={state?.fields?.password}
          hint="At least 10 characters"
          autoComplete="new-password"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
          Close
        </button>
        <SubmitButton pending="Adding…">Add member</SubmitButton>
      </div>
    </form>
  )
}

export function RemoveMember({ id, name }: { id: string; name: string }) {
  const [state, action] = useActionState<FormState, FormData>(deleteMember.bind(null, id), undefined)
  return (
    <form action={action} className="flex items-center gap-2">
      {state?.error && <span className="text-xs text-bad">{state.error}</span>}
      <SubmitButton className="btn btn-ghost px-2.5 text-bad" aria-label={`Remove ${name}`} pending="…">
        <Trash2 className="size-4" aria-hidden="true" />
      </SubmitButton>
    </form>
  )
}
