import { createSupabaseServerClient } from '@/lib/supabase-server'
import ScheduleClient from './ScheduleClient'
import { subDays, addDays } from 'date-fns'

export default async function HorarioPage() {
  const supabase = await createSupabaseServerClient()

  // Calculamos un rango más amplio (30 días en el pasado y 60 en el futuro)
  // Esto permite que el usuario pueda ver el historial de clases de la semana pasada
  const pastDate = subDays(new Date(), 30).toISOString()
  const futureDate = addDays(new Date(), 60).toISOString()

  // 1. Obtener usuario (null si no está logueado)
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Obtener TODAS las sesiones (clases) en el nuevo rango de fechas
  const { data: sessionsRaw } = await supabase
    .from('sessions')
    .select('*, class_types(*), instructors(*)')
    .gte('starts_at', pastDate) // Traemos desde hace un mes
    .lte('starts_at', futureDate) // Traemos hasta dos meses a futuro
    .eq('is_cancelled', false)
    .order('starts_at')

  const sessionIds = (sessionsRaw ?? []).map(s => s.id)

  // 3. Calcular los espacios contando las reservas reales
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

  // 4. Ver qué clases ya reservó EL USUARIO ACTUAL
  let bookedSessionIds: string[] = []
  if (user) {
    const { data: userBookings } = await supabase
      .from('bookings')
      .select('session_id')
      .eq('user_id', user.id)
      .in('status', ['confirmed', 'pending'])

    bookedSessionIds = (userBookings ?? []).map((b: any) => b.session_id)
  }

  // 5. Mapear las sesiones con los espacios sobrantes
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