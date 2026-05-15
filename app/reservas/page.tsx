import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ReservasClient from './ReservasClient'

export default async function ReservasPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      sessions (
        starts_at,
        location,
        class_types ( name ),
        instructors ( name )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <ReservasClient profile={profile} bookings={bookings ?? []} />
}