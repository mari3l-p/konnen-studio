import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import FacturasClient from './FacturasClient'

export default async function FacturasPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, sessions(starts_at, price_cents, class_types(name))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <FacturasClient profile={profile} bookings={bookings ?? []} />
}