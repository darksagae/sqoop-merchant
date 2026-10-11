'use server'

import { revalidatePath } from 'next/cache'
import { requireOwner, requireUser } from '../auth'
import { UserError } from '../errors'
import { renameWorkspace } from '../repo/accounts'
import { addStore, updateStore } from '../repo/stores'
import { addMember, removeMember } from '../repo/team'
import { memberSchema, storeSchema, workspaceSchema } from '../validation'
import { failure, invalid, type FormState } from './state'

const done = (message: string): FormState => {
  revalidatePath('/app', 'layout')
  return { values: { ok: message } }
}

export async function saveStore(storeId: string | null, _: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser()
  const parsed = storeSchema.safeParse(Object.fromEntries(form))
  if (!parsed.success) return invalid(form, parsed.error)
  try {
    if (storeId) updateStore(user.workspaceId, storeId, parsed.data)
    else addStore(user.workspaceId, parsed.data)
  } catch (error) {
    return failure(form, error)
  }
  return done(storeId ? 'Store updated.' : 'Store added.')
}

export async function inviteMember(_: FormState, form: FormData): Promise<FormState> {
  try {
    const user = await requireOwner()
    const parsed = memberSchema.safeParse(Object.fromEntries(form))
    if (!parsed.success) return invalid(form, parsed.error)
    await addMember(user.workspaceId, parsed.data)
  } catch (error) {
    return failure(form, error)
  }
  return done('Team member added. Share their email and password with them privately.')
}

export async function deleteMember(userId: string, _: FormState, form: FormData): Promise<FormState> {
  try {
    const user = await requireOwner()
    if (user.id === userId) throw new UserError('You cannot remove yourself.')
    removeMember(user.workspaceId, userId)
  } catch (error) {
    return failure(form, error)
  }
  return done('Team member removed.')
}

export async function saveWorkspace(_: FormState, form: FormData): Promise<FormState> {
  try {
    const user = await requireOwner()
    const parsed = workspaceSchema.safeParse(Object.fromEntries(form))
    if (!parsed.success) return invalid(form, parsed.error)
    renameWorkspace(user.workspaceId, parsed.data.name)
  } catch (error) {
    return failure(form, error)
  }
  return done('Business name saved.')
}
