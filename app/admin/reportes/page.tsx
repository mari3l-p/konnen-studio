import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function ReportesPage() {
  const supabase = await createSupabaseServerClient()

  const [
    { count: totalSessions },
    { count: activeSessions },
    { count: totalBookings },
    { count: confirmedBookings },
    { count: cancelledBookings },
    { data: byClass },
  ] = await Promise.all([
    supabase.from('sessions').select('*', { count: 'exact', head: true }),
    supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('is_cancelled', false),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
    supabase.from('sessions').select('class_types(name), bookings(count)'),
  ])

  const stats = [
    { label: 'Sesiones creadas', value: totalSessions ?? 0 },
    { label: 'Sesiones activas', value: activeSessions ?? 0 },
    { label: 'Total reservas', value: totalBookings ?? 0 },
    { label: 'Confirmadas', value: confirmedBookings ?? 0 },
    { label: 'Canceladas', value: cancelledBookings ?? 0 },
    { label: 'Tasa de confirmación', value: totalBookings ? `${Math.round(((confirmedBookings ?? 0) / totalBookings) * 100)}%` : '—' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Reportes</h1>
        <p className="text-gray-400 text-sm mt-1">Métricas generales del negocio</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map(({ label, value }) => (
          <div key={label} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-gray-400 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}