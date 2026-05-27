import { createSupabaseServerClient } from '@/lib/supabase-server'
import EventosClient from './EventosClient'

export default async function EventosPage() {
  const supabase = await createSupabaseServerClient()

  // Solo traemos los eventos que no han pasado y no están cancelados
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('is_cancelled', false)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })

  return <EventosClient initialEvents={events || []} />
}