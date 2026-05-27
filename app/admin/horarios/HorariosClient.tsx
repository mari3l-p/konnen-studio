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

// Función para forzar la visualización en hora de México en la tabla
function toMexicoTime(dateInput: string | Date) {
  const date = new Date(dateInput);
  const mxString = date.toLocaleString("en-US", { timeZone: "America/Mexico_City" });
  return new Date(mxString);
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
    location: 'Konnen Studio',
  })

  async function handleCreate() {
    setLoading(true)

    // MAGIA: Tomamos la hora que escribiste (ej. "2026-05-20T22:00")
    // y le pegamos explícitamente la zona horaria de Mérida/CDMX (-06:00)
    const startsAtMexico = `${form.starts_at}:00-06:00`

    // Creamos una copia del formulario con la fecha corregida
    const payload = {
      ...form,
      starts_at: startsAtMexico
    }

    const { error } = await supabase.from('sessions').insert([payload])
    
    if (error) {
      console.error("Error creating session:", error.message)
      alert("Error: " + error.message)
    } else {
      router.refresh()
      setShowForm(false)
      // Resetear formulario
      setForm({
        class_type_id: '',
        instructor_id: '',
        starts_at: '',
        capacity: 15,
        location: 'Konnen Studio',
      })
    }
    setLoading(false)
  }

  async function handleCancel(id: string) {
    const { error } = await supabase.from('sessions').update({ is_cancelled: true }).eq('id', id)
    if (!error) {
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_cancelled: true } : s))
      )
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Gestión de Horarios</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva clase
            </button>
            <button onClick={handleLogout} className="text-gray-400 hover:text-white p-2">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-gray-900 rounded-2xl p-6 mb-8 border border-gray-700">
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
                <label className="text-xs text-gray-400 uppercase tracking-widest">Fecha y hora (Hora México)</label>
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

              <div className="flex flex-col gap-1 md:col-span-2">
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
                disabled={loading || !form.class_type_id || !form.starts_at}
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

        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-widest">
                <th className="px-6 py-4">Fecha y hora (MX)</th>
                <th className="px-6 py-4">Clase</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 text-gray-300">
                    {/* Imprimimos la fecha forzando la zona de México */}
                    {format(toMexicoTime(s.starts_at), "dd MMM · hh:mm aa", { locale: es })}
                  </td>
                  <td className="px-6 py-4 font-medium">{s.class_types?.name}</td>
                  <td className="px-6 py-4">
                    {s.is_cancelled ? (
                      <span className="text-red-400 text-xs font-semibold">Cancelada</span>
                    ) : (
                      <span className="text-green-400 text-xs font-semibold">Activa</span>
                    )}
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
    </div>
  )
}