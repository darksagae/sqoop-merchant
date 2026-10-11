import type { Metadata } from 'next'
import { MemberForm, RemoveMember, StoreForm, StoreRow, WorkspaceForm } from '@/components/settings-forms'
import { Badge, PageHeader } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { listStores } from '@/lib/repo/stores'
import { listMembers } from '@/lib/repo/team'

export const metadata: Metadata = { title: 'Stores & team' }

export default async function SettingsPage() {
  const user = await requireUser()
  const stores = listStores(user.workspaceId)
  const members = listMembers(user.workspaceId)
  const isOwner = user.role === 'owner'

  return (
    <>
      <PageHeader title="Stores & team" description="Your locations and the people who sell for you." />
      <div className="space-y-6">
        <section className="card p-5 sm:p-6" aria-labelledby="business-title">
          <h2 id="business-title" className="mb-4 font-semibold">
            Business
          </h2>
          <WorkspaceForm name={user.workspaceName} canEdit={isOwner} />
        </section>

        <section className="card overflow-hidden" aria-labelledby="stores-title">
          <div className="px-5 pt-5">
            <h2 id="stores-title" className="font-semibold">
              Stores <span className="font-normal text-ink-soft">({stores.length})</span>
            </h2>
            <p className="text-sm text-ink-soft">Each order belongs to a store, so you can see sales per branch.</p>
          </div>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {stores.map((store) => (
              <StoreRow key={store.id} store={store} />
            ))}
          </ul>
          <div className="bg-sunken/50 p-5">
            <StoreForm />
          </div>
        </section>

        <section className="card overflow-hidden" aria-labelledby="team-title">
          <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
            <div>
              <h2 id="team-title" className="font-semibold">
                Team <span className="font-normal text-ink-soft">({members.length})</span>
              </h2>
              <p className="text-sm text-ink-soft">
                Staff can record orders and manage products. Only the owner manages the team and business details.
              </p>
            </div>
          </div>
          <ul className="mt-3 divide-y divide-line border-t border-line">
            {members.map((member) => (
              <li key={member.id} className="flex items-center gap-3 px-5 py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sunken text-sm font-bold">
                  {member.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {member.name} {member.id === user.id && <span className="font-normal text-ink-soft">(you)</span>}
                  </p>
                  <p className="truncate text-sm text-ink-soft">{member.email}</p>
                </div>
                <Badge tone={member.role === 'owner' ? 'brand' : 'neutral'}>{member.role}</Badge>
                {isOwner && member.role === 'staff' && <RemoveMember id={member.id} name={member.name} />}
              </li>
            ))}
          </ul>
          {isOwner && (
            <div className="border-t border-line p-5">
              <MemberForm />
            </div>
          )}
        </section>
      </div>
    </>
  )
}
