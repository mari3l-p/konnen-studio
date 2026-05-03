import { createSupabaseServerClient } from '@/lib/supabase-server'
import { CalendarDays, Users, BookCheck, TrendingUp } from 'lucide-react'


export default async function AdminOverview() {
  const supabase = await createSupabaseServerClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [
    { count: totalBookings },
    { count: confirmedBookings },
    { count: todaySessions },
    { count: totalClients },
    { data: recentBookings },
  ] = await Promise.all([
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('sessions').select('*', { count: 'exact', head: true })
      .gte('starts_at', today.toISOString())
      .lt('starts_at', tomorrow.toISOString())
      .eq('is_cancelled', false),
    supabase.from('bookings').select('user_id', { count: 'exact', head: true }),
    supabase.from('bookings')
      .select('*, sessions(starts_at, class_types(name)), profiles:user_id(email)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const stats = [
    { label: 'Reservas totales', value: totalBookings ?? 0, icon: BookCheck, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Confirmadas', value: confirmedBookings ?? 0, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Clases hoy', value: todaySessions ?? 0, icon: CalendarDays, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Clientes únicos', value: totalClients ?? 0, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Resumen</h1>
        <p className="text-gray-400 text-sm mt-1">Bienvenido al panel de administración</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-gray-400 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white">Reservas recientes</h2>
        </div>
        <div className="divide-y divide-gray-800">
          {recentBookings?.length === 0 && (
            <p className="px-6 py-8 text-gray-500 text-sm text-center">Sin reservas aún</p>
          )}
          {recentBookings?.map((b: any) => (
            <div key={b.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">{b.sessions?.class_types?.name ?? '—'}</p>
                <p className="text-gray-400 text-xs">{b.profiles?.email ?? b.user_id}</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                ${b.status === 'confirmed' ? 'bg-green-500/10 text-green-400' :
                  b.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                  'bg-yellow-500/10 text-yellow-400'}`}>
                {b.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}