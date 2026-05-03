'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Trash2, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Session, ClassType, Instructor } from '@/types'
import { useRouter } from 'next/navigation'

type Props = {
  sessions: Session[]
  classTypes: ClassType[]
  instructors: Instructor[]
}

export default function HorariosClient({ sessions: initial, classTypes, instructors }: Props) {
  const router = useRouter()
  const [sessions, setSessions] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    class_type_id: '',
    instructor_id: '',
    starts_at: '',
    capacity: 15,
    price_cents: 15000,
    location: 'flexroom',
  })

  async function handleCreate() {
    setLoading(true)
    const { error } = await supabase.from('sessions').insert([form])
    if (!error) {
      router.refresh()
      setShowForm(false)
      setForm({ class_type_id: '', instructor_id: '', starts_at: '', capacity: 15, price_cents: 15000, location: 'flexroom' })
    }
    setLoading(false)
  }

  async function handleCancel(id: string) {
    await supabase.from('sessions').update({ is_cancelled: true }).eq('id', id)
    setSessions(prev => prev.map(s => s.id === id ? { ...s, is_cancelled: true } : s))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Horarios</h1>
          <p className="text-gray-400 text-sm mt-1">Gestiona las sesiones programadas</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva sesión
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-base font-bold mb-5">Nueva sesión</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Clase</label>
              <select
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white"
                value={form.class_type_id}
                onChange={(e) => setForm({ ...form, class_type_id: e.target.value })}
              >
                <option value="">Seleccionar...</option>
                {classTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Instructor</label>
              <select
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white"
                value={form.instructor_id}
                onChange={(e) => setForm({ ...form, instructor_id: e.target.value })}
              >
                <option value="">Seleccionar...</option>
                {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Fecha y hora</label>
              <input
                type="datetime-local"
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Capacidad</label>
              <input
                type="number"
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Precio (centavos MXN)</label>
              <input
                type="number"
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white"
                value={form.price_cents}
                onChange={(e) => setForm({ ...form, price_cents: Number(e.target.value) })}
              />
              <span className="text-xs text-gray-500">= ${(form.price_cents / 100).toFixed(0)} MXN</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Ubicación</label>
              <input
                type="text"
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCreate}
              disabled={loading || !form.class_type_id || !form.starts_at}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              {loading ? 'Guardando...' : 'Crear sesión'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-white px-4 py-2.5 rounded-xl text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-widest">
              <th className="text-left px-6 py-4">Fecha y hora</th>
              <th className="text-left px-6 py-4">Clase</th>
              <th className="text-left px-6 py-4">Instructor</th>
              <th className="text-left px-6 py-4">Espacios</th>
              <th className="text-left px-6 py-4">Precio</th>
              <th className="text-left px-6 py-4">Estado</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                  No hay sesiones creadas aún
                </td>
              </tr>
            )}
            {sessions.map(s => (
              <tr key={s.id} className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
                <td className="px-6 py-4 text-gray-300">
                  {format(new Date(s.starts_at), "dd MMM · hh:mm aa", { locale: es })}
                </td>
                <td className="px-6 py-4 font-medium">{s.class_types.name}</td>
                <td className="px-6 py-4 text-gray-400">{s.instructors?.name ?? '—'}</td>
                <td className="px-6 py-4 text-gray-400">
                  {s.session_availability?.spots_left ?? '—'} / {s.capacity}
                </td>
                <td className="px-6 py-4 text-gray-400">${(s.price_cents / 100).toFixed(0)}</td>
                <td className="px-6 py-4">
                  {s.is_cancelled
                    ? <span className="text-xs font-semibold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full">Cancelada</span>
                    : <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full">Activa</span>
                  }
                </td>
                <td className="px-6 py-4">
                  {!s.is_cancelled && (
                    <button
                      onClick={() => handleCancel(s.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}