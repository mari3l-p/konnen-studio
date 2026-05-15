import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import MembresiastClient from './MembresiastClient'

export default async function MembresiasPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  // For now bookings with package info — extend when you add user_packages table
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, sessions(starts_at, class_types(name))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <MembresiastClient profile={profile} bookings={bookings ?? []} />
}