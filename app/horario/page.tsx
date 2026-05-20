import { createSupabaseServerClient } from '@/lib/supabase-server'
import ScheduleClient from './ScheduleClient'
import { startOfWeek, addWeeks } from 'date-fns'

export default async function HorarioPage() {
  const supabase = await createSupabaseServerClient()

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const rangeEnd = addWeeks(weekStart, 4)

  // 1. Obtener usuario (null si no está logueado)
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Obtener TODAS las sesiones (clases) en el rango de fechas
  const { data: sessionsRaw } = await supabase
    .from('sessions')
    .select('*, class_types(*), instructors(*)')
    .gte('starts_at', weekStart.toISOString())
    .lte('starts_at', rangeEnd.toISOString())
    .eq('is_cancelled', false)
    .order('starts_at')

  const sessionIds = (sessionsRaw ?? []).map(s => s.id)

  // 3. NUEVO: Calcular los espacios contando las reservas reales
  let bookingCounts: Record<string, number> = {}

  if (sessionIds.length > 0) {
    const { data: allBookings } = await supabase
      .from('bookings')
      .select('session_id')
      .in('session_id', sessionIds)
      .eq('status', 'confirmed') // Solo contamos las que ya se confirmaron

    // Contamos cuántas personas hay inscritas por cada clase
    allBookings?.forEach(b => {
      bookingCounts[b.session_id] = (bookingCounts[b.session_id] || 0) + 1
    })
  }

  // 4. Ver qué clases ya reservó EL USUARIO ACTUAL (para el botón "Ya reservada")
  let bookedSessionIds: string[] = []
  if (user) {
    const { data: userBookings } = await supabase
      .from('bookings')
      .select('session_id')
      .eq('user_id', user.id)
      .in('status', ['confirmed', 'pending'])

    bookedSessionIds = (userBookings ?? []).map((b: any) => b.session_id)
  }

  // 5. Mapear las sesiones con los espacios sobrantes matemáticamente exactos
  const sessions = (sessionsRaw ?? []).map(s => {
    // Obtenemos cuántos han reservado (o 0 si nadie ha reservado)
    const bookedCount = bookingCounts[s.id] || 0
    // Restamos la capacidad total menos los inscritos
    const spotsLeft = s.capacity - bookedCount

    return {
      ...s,
      // Le pasamos la información exacta a tu Client Component
      session_availability: {
        spots_left: spotsLeft > 0 ? spotsLeft : 0
      }
    }
  })

  return (
    <ScheduleClient
      sessions={sessions}
      bookedSessionIds={bookedSessionIds}
      isLoggedIn={!!user}
    />
  )
}