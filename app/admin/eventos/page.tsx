import { createSupabaseServerClient } from '@/lib/supabase-server'
import EventosAdminClient from './EventosAdminClient'

export default async function AdminEventosPage() {
  const supabase = await createSupabaseServerClient()

  // En el panel de admin queremos ver TODOS los eventos, creados por fecha
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('starts_at', { ascending: false })

  return (
    <div className="p-6">
      <EventosAdminClient events={events || []} />
    </div>
  )
}