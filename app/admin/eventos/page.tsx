import { createSupabaseServerClient } from '@/lib/supabase-server'
import EventosAdminClient from './EventosAdminClient'

export default async function EventosAdminPage() {
  const supabase = await createSupabaseServerClient()
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('starts_at', { ascending: true })

  return <EventosAdminClient events={events ?? []} />
}