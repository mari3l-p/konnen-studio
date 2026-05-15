'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Trash2, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Session, ClassType, Instructor } from '@/types'
import { useRouter } from 'next/navigation'

type Props = {
  sessions: Session[]
  classTypes: ClassType[]
  instructors: Instructor[]
}

export default function AdminClient({ sessions: initial, classTypes, instructors }: Props) {
  const router = useRouter()
  const [sessions, setSessions] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    class_type_id: '',
    instructor_id: '',
    starts_at: '',
    capacity: 15,
    price: 150,
    location: 'flexroom',
  })

  async function handleCreate() {
    setLoading(true)
    // Ahora enviamos 'price' directamente a la tabla
    const { error } = await supabase.from('sessions').insert([form])
    if (!error) {
      router.refresh()
      setShowForm(false)
    } else {
      console.error("Error al crear sesión:", error.message)
    }
    setLoading(false)
  }

  async function handleCancel(id: string) {
    await supabase.from('sessions').update({ is_cancelled: true }).eq('id', id)
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_cancelled: true } : s))
    )
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
            <span className="text-black font-extrabold text-xs">Kn</span>
          </div>
          <span className="font-bold">Admin · Konnen Studio</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva clase
          </button>
          <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Create form */}
        {showForm && (
          <div className="bg-gray-900 rounded-2xl p-6 mb-8 border border-gray-700 shadow-xl">
            <h2 className="text-lg font-bold mb-6">Nueva sesión</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase tracking-widest">Clase</label>
                <select
                  className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                  value={form.class_type_id}
                  onChange={(e) => setForm({ ...form, class_type_id: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  {classTypes.map((ct) => (
                    <option key={ct.id} value={ct.id}>{ct.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase tracking-widest">Instructor</label>
                <select
                  className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                  value={form.instructor_id}
                  onChange={(e) => setForm({ ...form, instructor_id: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  {instructors.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase tracking-widest">Fecha y hora</label>
                <input
                  type="datetime-local"
                  className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase tracking-widest">Capacidad</label>
                <input
                  type="number"
                  className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase tracking-widest">Precio (MXN)</label>
                <input
                  type="number"
                  className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Ej: 250"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
                <span className="text-xs text-gray-500">
                  Monto total a cobrar por Stripe
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase tracking-widest">Ubicación</label>
                <input
                  type="text"
                  className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreate}
                disabled={loading || !form.class_type_id || !form.starts_at || form.price < 10}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                {loading ? 'Guardando...' : 'Crear sesión'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white px-4 py-2.5 rounded-xl text-sm transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Sessions table */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-widest">
                <th className="text-left px-6 py-4">Fecha y hora</th>
                <th className="text-left px-6 py-4">Clase</th>
                <th className="text-left px-6 py-4">Instructor</th>
                <th className="text-left px-6 py-4">Espacios</th>
                <th className="text-left px-6 py-4">Precio</th>
                <th className="text-left px-6 py-4">Estado</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 text-gray-300">
                    {format(new Date(s.starts_at), "dd MMM · hh:mm aa", { locale: es })}
                  </td>
                  <td className="px-6 py-4 font-medium">{s.class_types?.name}</td>
                  <td className="px-6 py-4 text-gray-400">{s.instructors?.name ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-400">
                    {s.session_availability?.spots_left ?? '—'} / {s.capacity}
                  </td>
                  <td className="px-6 py-4 text-gray-300 font-medium">
                    ${s.price}
                  </td>
                  <td className="px-6 py-4">
                    {s.is_cancelled ? (
                      <span className="bg-red-500/10 text-red-400 px-2 py-1 rounded-md text-[10px] uppercase font-bold">Cancelada</span>
                    ) : (
                      <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded-md text-[10px] uppercase font-bold">Activa</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {!s.is_cancelled && (
                      <button
                        onClick={() => handleCancel(s.id)}
                        className="text-gray-500 hover:text-red-400 transition-colors p-1"
                        title="Cancelar clase"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 italic">
                    No hay sesiones programadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}