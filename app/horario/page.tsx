import { createSupabaseServerClient } from '@/lib/supabase-server'
import ScheduleClient from './ScheduleClient'
import { startOfWeek, addWeeks } from 'date-fns'

export default async function HorarioPage() {
  const supabase = createSupabaseServerClient()

  // Traer sesiones de las próximas 4 semanas para que la navegación funcione client-side
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const rangeEnd = addWeeks(weekStart, 4)

  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      *,
      class_types(*),
      instructors(*),
      session_availability(spots_left)
    `)
    .gte('starts_at', weekStart.toISOString())
    .lte('starts_at', rangeEnd.toISOString())
    .eq('is_cancelled', false)
    .order('starts_at')

  return <ScheduleClient sessions={sessions ?? []} />
}