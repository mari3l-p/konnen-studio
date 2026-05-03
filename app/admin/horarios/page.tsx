import { createSupabaseServerClient } from '@/lib/supabase-server'
import HorariosClient from './HorariosClient'

export default async function HorariosPage() {
  const supabase = await createSupabaseServerClient()

  const [{ data: sessions }, { data: classTypes }, { data: instructors }] = await Promise.all([
    supabase
      .from('sessions')
      .select('*, class_types(*), instructors(*), session_availability(spots_left)')
      .order('starts_at', { ascending: false })
      .limit(100),
    supabase.from('class_types').select('*').order('name'),
    supabase.from('instructors').select('*').order('name'),
  ])

  return (
    <HorariosClient
      sessions={sessions ?? []}
      classTypes={classTypes ?? []}
      instructors={instructors ?? []}
    />
  )
}