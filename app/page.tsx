import { redirect } from 'next/navigation'
import { currentUser } from '@/lib/auth'

// No marketing page: signed-in users go to their dashboard, everyone else signs in.
export default async function Home() {
  redirect((await currentUser()) ? '/app' : '/login')
}
