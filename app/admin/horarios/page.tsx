import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import ScheduleManager from '@/app/components/shared/ScheduleManager'
import { subDays } from 'date-fns'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HorariosPage() {
  const supabase = await createSupabaseServerClient()

  const [{ data: classTypes }, { data: instructors }] = await Promise.all([
    supabase.from('class_types').select('*').order('name'),
    supabase.from('instructors').select('*').order('name'),
  ])

  const pastDate = subDays(new Date(), 30).toISOString()

  // Bypass de RLS para traer bookings+profiles igual que en /instructores,
  // así ambos lados calculan attendees/availability de la misma forma.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: rawClasses, error } = await supabaseAdmin
    .from('sessions')
    .select(`
      *,
      class_types(name, duration_mins),
      instructors(name),
      bookings(*, profiles(full_name))
    `)
    .gte('starts_at', pastDate)
    .order('starts_at', { ascending: true })

  if (error) {
    console.error('Error de Supabase al cargar clases (admin):', error.message)
  }

  const initialClasses = rawClasses?.map((session: any) => {
    const activeBookings = session.bookings?.filter((reserva: any) => {
      const estadoReserva = reserva.status || ''
      return estadoReserva.toLowerCase() !== 'cancelled' && estadoReserva.toLowerCase() !== 'cancelada'
    }) || []

    const attendees = activeBookings.map((reserva: any) => {
      const perfil = reserva.profiles || {}
      return {
        id: reserva.id,
        name: reserva.guest_name || perfil.full_name || 'Reserva manual sin nombre'
      }
    })

    const bookedCount = activeBookings.length
    const capacity = session.capacity || 15

    const { bookings, ...sessionWithoutBookings } = session

    return {
      ...sessionWithoutBookings,
      attendees,
      availability: {
        booked_count: bookedCount,
        spots_left: capacity - bookedCount
      }
    }
  }) || []

  return (
    <ScheduleManager
      isAdmin={true}
      initialClasses={initialClasses}
      classTypes={classTypes || []}
      instructors={instructors || []}
      // Sin logoutRedirectPath: mantiene el comportamiento actual (sin botón "Salir" aquí)
    />
  )
}