import { createSupabaseServerClient } from '@/lib/supabase-server'
import ScheduleClient from './ScheduleClient'
import { startOfWeek, addWeeks } from 'date-fns'

export default async function HorarioPage() {
  const supabase = await createSupabaseServerClient()

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const rangeEnd = addWeeks(weekStart, 4)

  // Get user — null if not logged in
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: sessionsRaw },
    { data: availability },
  ] = await Promise.all([
    supabase
      .from('sessions')
      .select('*, class_types(*), instructors(*)')
      .gte('starts_at', weekStart.toISOString())
      .lte('starts_at', rangeEnd.toISOString())
      .eq('is_cancelled', false)
      .order('starts_at'),
    supabase.from('session_availability').select('*'),
  ])

  // Only fetch user bookings if actually logged in
  let bookedSessionIds: string[] = []
  if (user) {
    const { data: userBookings } = await supabase
      .from('bookings')
      .select('session_id')
      .eq('user_id', user.id)  // ← strict filter by logged-in user
      .in('status', ['confirmed', 'pending'])

    bookedSessionIds = (userBookings ?? []).map((b: any) => b.session_id)
  }

  const sessions = (sessionsRaw ?? []).map(s => ({
    ...s,
    session_availability: (availability ?? []).find(a => a.session_id === s.id) ?? null,
  }))

  return (
    <ScheduleClient
      sessions={sessions ?? []}
      bookedSessionIds={bookedSessionIds}
      isLoggedIn={!!user}
    />
  )
}