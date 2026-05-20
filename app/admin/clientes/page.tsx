import { createSupabaseServerClient } from '@/lib/supabase-server'
import ClientesClient from './ClientesClient'

export default async function ClientesPage() {
  const supabase = await createSupabaseServerClient()

  // 1. Obtener todos los perfiles registrados de la tabla 'profiles'
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .order('full_name', { ascending: true })

  // 2. Obtener todas las reservas para calcular las estadísticas de asistencia de cada uno
  const { data: bookings } = await supabase
    .from('bookings')
    .select('user_id, status, created_at')
    .order('created_at', { ascending: false })

  // 3. Obtener los paquetes para el componente de asignación manual
  const { data: packages } = await supabase
    .from('packages')
    .select('id, title, price')
    .order('price', { ascending: true })

  // 4. Agrupar las reservas por ID de usuario para cruzarlas eficientemente
  // Como ya vienen ordenadas por 'created_at' descendente, el primer registro que leamos será el más reciente
  const bookingsMap = new Map<string, { total: number; confirmed: number; lastBooking: string | null }>()

  bookings?.forEach((b: any) => {
    if (!bookingsMap.has(b.user_id)) {
      bookingsMap.set(b.user_id, { total: 0, confirmed: 0, lastBooking: b.created_at })
    }
    const stat = bookingsMap.get(b.user_id)!
    stat.total++
    if (b.status === 'confirmed') {
      stat.confirmed++
    }
  })

  // 5. Construir la lista final combinando TODOS los perfiles con sus respectivas estadísticas
  const users = (profiles || []).map((p: any) => {
    const stats = bookingsMap.get(p.id) || { total: 0, confirmed: 0, lastBooking: null }
    
    return {
      userId: p.id,
      fullName: p.full_name || 'Sin nombre',
      totalBookings: stats.total,
      confirmed: stats.confirmed,
      lastBooking: stats.lastBooking // Puede ser un string de fecha o null
    }
  })

  return (
    <ClientesClient users={users} packages={packages || []} />
  )
}