import { createSupabaseServerClient } from '@/lib/supabase-server'
import EventosClient from './EventosClient'

export default async function EventosPage() {
  const supabase = await createSupabaseServerClient()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('is_cancelled', false)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })

  const { data: { user } } = await supabase.auth.getUser()

  let registeredEventIds: string[] = []
  if (user) {
    const { data: registros } = await supabase.rpc('mis_eventos_registrados')
    registeredEventIds = (registros ?? []).map((r: any) => r.event_id)
  }

  return <EventosClient initialEvents={events || []} registeredEventIds={registeredEventIds} />
}