import { createSupabaseServerClient } from '@/lib/supabase-server'
import HorariosClient from './HorariosClient'

export default async function HorariosPage() {
  const supabase = await createSupabaseServerClient()

  const [
    { data: sessionsRaw },
    { data: classTypes },
    { data: instructors },
    { data: availability },
  ] = await Promise.all([
    supabase
      .from('sessions')
      .select('*, class_types(*), instructors(*)')
      .order('starts_at', { ascending: false })
      .limit(100),
    supabase.from('class_types').select('*').order('name'),
    supabase.from('instructors').select('*').order('name'),
    supabase.from('session_availability').select('*'),
  ])

  // Merge availability into sessions
  const sessions = (sessionsRaw ?? []).map(s => ({
    ...s,
    session_availability: availability?.find(a => a.session_id === s.id) ?? null,
  }))

  return (
    <HorariosClient
      sessions={sessions}
      classTypes={classTypes ?? []}
      instructors={instructors ?? []}
    />
  )
}