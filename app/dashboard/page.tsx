import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get upcoming bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, sessions(starts_at, class_types(name), instructors(name), location)')
    .eq('user_id', user.id)
    .eq('status', 'confirmed')
    .gte('sessions.starts_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(5)

  return (
    <DashboardClient
      profile={profile}
      bookings={bookings ?? []}
    />
  )
}