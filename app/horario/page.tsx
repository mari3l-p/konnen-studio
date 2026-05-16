import { createSupabaseServerClient } from '@/lib/supabase-server'
import ScheduleClient from './ScheduleClient'
import { startOfWeek, addWeeks } from 'date-fns'

export default async function HorarioPage() {
  const supabase = await createSupabaseServerClient()

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const rangeEnd = addWeeks(weekStart, 4)

  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: sessionsRaw },
    { data: availability },
    { data: userBookings },
  ] = await Promise.all([
    supabase
      .from('sessions')
      .select('*, class_types(*), instructors(*)')
      .gte('starts_at', weekStart.toISOString())
      .lte('starts_at', rangeEnd.toISOString())
      .eq('is_cancelled', false)
      .order('starts_at'),
    supabase.from('session_availability').select('*'),
    user
      ? supabase
          .from('bookings')
          .select('session_id, status')
          .eq('user_id', user.id)
          .in('status', ['confirmed', 'pending'])
      : Promise.resolve({ data: [] }),
  ])

  const sessions = (sessionsRaw ?? []).map(s => ({
    ...s,
    session_availability: (availability ?? []).find(a => a.session_id === s.id) ?? null,
  }))

  const bookedSessionIds = Array.from(
    new Set((userBookings ?? []).map((b: any) => b.session_id))
  )

  return (
    <ScheduleClient
      sessions={sessions ?? []}
      bookedSessionIds={bookedSessionIds}
    />
  )
}