import { createSupabaseServerClient } from '@/lib/supabase-server'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Función para convertir siempre a hora de México
function toMexicoTime(dateInput: string | Date) {
  const date = new Date(dateInput)
  const mxString = date.toLocaleString('en-US', { timeZone: 'America/Mexico_City' })
  return new Date(mxString)
}

export default async function ReservasPage() {
  const supabase = await createSupabaseServerClient()

  // 1. Consultar reservas SIN el join de perfiles (Asegúrate de pedir guest_name)
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      sessions (
        starts_at,
        class_types ( name ),
        instructors ( name )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) console.error('Reservas error:', error.message)

  // 2. Consultar perfiles por separado
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')

  // 3. Crear un mapa para buscar rápidamente el nombre por el ID del usuario
  const profileMap: Record<string, string> = {}
  if (profiles) {
    profiles.forEach(p => {
      profileMap[p.id] = p.full_name
    })
  }

  const statusColors: Record<string, string> = {
    confirmed: 'text-green-400 bg-green-500/10',
    pending: 'text-yellow-400 bg-yellow-500/10',
    cancelled: 'text-red-400 bg-red-500/10',
    refunded: 'text-gray-400 bg-gray-500/10',
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Reservas</h1>
        <p className="text-gray-400 text-sm mt-1">Todas las reservas del sistema</p>
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-widest">
              <th className="text-left px-6 py-4">Usuario</th>
              <th className="text-left px-6 py-4">Clase</th>
              <th className="text-left px-6 py-4">Instructor</th>
              <th className="text-left px-6 py-4">Fecha sesión</th>
              <th className="text-left px-6 py-4">Reservado</th>
              <th className="text-left px-6 py-4">Estado</th>
            </tr>
          </thead>
          <tbody>
            {!bookings?.length && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  Sin reservas aún
                </td>
              </tr>
            )}
            {bookings?.map((b: any) => (
              <tr
                key={b.id}
                className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-white font-medium">
                      {/* Si tiene user_id busca en el mapa, si no, usa guest_name */}
                      {b.user_id ? profileMap[b.user_id] : b.guest_name || 'Reserva manual'}
                    </span>
                    <span className="text-gray-500 text-[11px] font-mono mt-0.5 truncate max-w-32">
                      {/* Validamos si existe user_id antes de hacer split */}
                      {b.user_id ? `ID: ${b.user_id.split('-')[0]}...` : 'ID: Manual'}
                    </span>
                  </div>
                </td>
                
                <td className="px-6 py-4 font-medium text-white">
                  {b.sessions?.class_types?.name ?? '—'}
                </td>
                <td className="px-6 py-4 text-gray-400">
                  {b.sessions?.instructors?.name ?? '—'}
                </td>
                <td className="px-6 py-4 text-gray-400">
                  {b.sessions?.starts_at
                    ? format(toMexicoTime(b.sessions.starts_at), "dd MMM · hh:mm aa", { locale: es })
                    : '—'}
                </td>
                <td className="px-6 py-4 text-gray-400">
                  {format(toMexicoTime(b.created_at), "dd MMM yyyy", { locale: es })}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[b.status] ?? ''}`}>
                    {b.status === 'confirmed' ? 'Confirmada' : b.status === 'pending' ? 'Pendiente' : b.status === 'cancelled' ? 'Cancelada' : b.status === 'refunded' ? 'Reembolsada' : b.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}