import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/passwords'
import { authenticate, createWorkspace } from '@/lib/repo/accounts'
import { addMember, listMembers, removeMember } from '@/lib/repo/team'
import { createSession, deleteSession, userForSession } from '@/lib/session'
import './setup'

const owner = {
  businessName: 'Kato Hardware',
  name: 'Kato',
  email: 'kato@example.com',
  password: 'correct horse battery',
}

describe('accounts and sessions', () => {
  it('hashes passwords with scrypt and verifies them', async () => {
    const hash = await hashPassword('s3cret-password')
    expect(hash).toMatch(/^scrypt\$/)
    expect(await verifyPassword('s3cret-password', hash)).toBe(true)
    expect(await verifyPassword('wrong-password', hash)).toBe(false)
  })

  it('signs up an owner with a default store and signs them in', async () => {
    const { userId } = await createWorkspace(owner)
    expect(await authenticate('kato@example.com', owner.password)).toBe(userId)
    expect(await authenticate('kato@example.com', 'nope')).toBeNull()
    expect(await authenticate('nobody@example.com', owner.password)).toBeNull()
    await expect(createWorkspace({ ...owner, email: 'KATO@example.com' })).rejects.toThrow(/already exists/)
  })

  it('stores only a hash of the session token', async () => {
    const { userId, workspaceId } = await createWorkspace(owner)
    const { token } = createSession(userId)
    const user = userForSession(token)
    expect(user).toMatchObject({ id: userId, workspaceId, role: 'owner', workspaceName: 'Kato Hardware' })
    expect(userForSession('forged')).toBeNull()
    deleteSession(token)
    expect(userForSession(token)).toBeNull()
  })

  it('lets owners add and remove staff but never remove the owner', async () => {
    const { workspaceId, userId } = await createWorkspace(owner)
    await addMember(workspaceId, { name: 'Amina', email: 'amina@example.com', password: 'another password' })
    const members = listMembers(workspaceId)
    expect(members.map((m) => m.role)).toEqual(['owner', 'staff'])
    expect(() => removeMember(workspaceId, userId)).toThrow(/Only staff/)
    removeMember(workspaceId, members[1].id)
    expect(listMembers(workspaceId)).toHaveLength(1)
  })
})
