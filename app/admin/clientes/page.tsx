import { createSupabaseServerClient } from '@/lib/supabase-server'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function ClientesPage() {
  const supabase = await createSupabaseServerClient()

  // Get unique users who have bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('user_id, status, created_at')
    .order('created_at', { ascending: false })

  // Group by user
  const usersMap = new Map<string, { userId: string; totalBookings: number; confirmed: number; lastBooking: string }>()

  bookings?.forEach((b: any) => {
    if (!usersMap.has(b.user_id)) {
      usersMap.set(b.user_id, { userId: b.user_id, totalBookings: 0, confirmed: 0, lastBooking: b.created_at })
    }
    const u = usersMap.get(b.user_id)!
    u.totalBookings++
    if (b.status === 'confirmed') u.confirmed++
  })

  const users = Array.from(usersMap.values())

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Clientes</h1>
        <p className="text-gray-400 text-sm mt-1">{users.length} clientes registrados</p>
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-widest">
              <th className="text-left px-6 py-4">Usuario ID</th>
              <th className="text-left px-6 py-4">Reservas totales</th>
              <th className="text-left px-6 py-4">Confirmadas</th>
              <th className="text-left px-6 py-4">Última reserva</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">Sin clientes aún</td></tr>
            )}
            {users.map(u => (
              <tr key={u.userId} className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
                <td className="px-6 py-4 text-gray-300 text-xs font-mono">{u.userId}</td>
                <td className="px-6 py-4 text-white font-semibold">{u.totalBookings}</td>
                <td className="px-6 py-4 text-green-400">{u.confirmed}</td>
                <td className="px-6 py-4 text-gray-400">
                  {format(new Date(u.lastBooking), "dd MMM yyyy", { locale: es })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}