'use client'

import { useState } from 'react'
import { format, addDays, startOfWeek, isSameDay, addWeeks, subWeeks } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, ChevronLeft, ChevronRight, X, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Session, ClassType, Instructor } from '@/types'
import { useRouter } from 'next/navigation'

type Props = {
  sessions: Session[]
  classTypes: ClassType[]
  instructors: Instructor[]
}

function toMexicoTime(dateInput: string | Date) {
  const date = new Date(dateInput)
  const mxString = date.toLocaleString('en-US', { timeZone: 'America/Mexico_City' })
  return new Date(mxString)
}

const DAYS = Array.from({ length: 7 }, (_, i) => i)

export default function HorariosClient({ sessions: initial, classTypes, instructors }: Props) {
  const router = useRouter()
  const [sessions, setSessions] = useState(initial)
  
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()) 
  
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  const [form, setForm] = useState({
    class_type_id: '',
    instructor_id: '',
    starts_at: '',
    capacity: 15,
    location: 'Konnen Studio',
  })

  async function handleCreate() {
    setLoading(true)
    const startsAtMexico = `${form.starts_at}:00-06:00`
    const payload = { ...form, starts_at: startsAtMexico }
    const { error } = await supabase.from('sessions').insert([payload])
    if (error) {
      alert('Error: ' + error.message)
    } else {
      router.refresh()
      setShowForm(false)
      setForm({ class_type_id: '', instructor_id: '', starts_at: '', capacity: 15, location: 'Konnen Studio' })
    }
    setLoading(false)
  }

  async function handleCancel(id: string) {
    await supabase.from('sessions').update({ is_cancelled: true }).eq('id', id)
    setSessions(prev => prev.map(s => s.id === id ? { ...s, is_cancelled: true } : s))
    setSelectedSession(null)
  }

  const weekDays = DAYS.map(i => addDays(weekStart, i))
  const monthLabel = format(weekStart, 'MMMM yyyy', { locale: es })
    .replace(/^\w/, c => c.toUpperCase())

  const listSessions = sessions.filter(s => isSameDay(toMexicoTime(s.starts_at), selectedDate))

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Horarios</h1>
          <p className="text-gray-400 text-sm mt-0.5">Gestiona las sesiones programadas</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-white"
          >
            <Plus className="w-4 h-4" />
            Nueva clase
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 shrink-0">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-white">Nueva sesión</h2>
            <button onClick={() => setShowForm(false)}>
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Clase</label>
              <select
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white"
                value={form.class_type_id}
                onChange={(e) => setForm({ ...form, class_type_id: e.target.value })}
              >
                <option value="">Seleccionar...</option>
                {classTypes.map(ct => (
                  <option key={ct.id} value={ct.id}>{ct.name}</option>
                ))}
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
                {instructors.map(i => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Fecha y hora (Hora México)</label>
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

            <div className="flex flex-col gap-1.5 md:col-span-2">
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
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors text-white"
            >
              {loading ? 'Guardando...' : 'Crear sesión'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-white px-4 py-2.5 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Week navigation */}
      <div className="flex items-center justify-between bg-gray-900 rounded-2xl px-5 py-3 border border-gray-800 shrink-0">
        <span className="text-white font-semibold capitalize">{monthLabel}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart(w => subWeeks(w, 1))}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => {
              const now = new Date()
              setWeekStart(startOfWeek(now, { weekStartsOn: 1 }))
              setSelectedDate(now) 
            }}
            className="px-3 py-1.5 text-xs font-medium border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors text-gray-300"
          >
            Hoy
          </button>
          <button
            onClick={() => setWeekStart(w => addWeeks(w, 1))}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* ── LIST VIEW ── */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden flex-1 flex flex-col min-h-[500px]">
        
        {/* Selector de días superior */}
        <div className="grid grid-cols-7 border-b border-gray-800 bg-gray-900/40 shrink-0">
          {weekDays.map((day, i) => {
            const isSelected = isSameDay(day, selectedDate)
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(day)}
                className={`py-3 text-center border-r last:border-r-0 border-gray-800 hover:bg-gray-800/60 transition-colors
                  ${isSelected ? 'bg-blue-600/20 border-b-2 border-b-blue-500' : ''}`}
              >
                <p className="text-xs text-gray-400 uppercase">
                  {format(day, 'EEE', { locale: es })}
                </p>
                <p className={`text-lg font-bold mt-0.5
                  ${isSelected ? 'text-blue-400' : 'text-white'}`}>
                  {format(day, 'd')}
                </p>
              </button>
            )
          })}
        </div>

        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/20 shrink-0">
          <h3 className="text-white font-semibold text-sm capitalize">
            Clases del {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
          </h3>
        </div>

        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-widest bg-gray-900/50">
                <th className="text-left px-6 py-4">Fecha y hora (MX)</th>
                <th className="text-left px-6 py-4">Clase</th>
                <th className="text-left px-6 py-4">Instructor</th>
                <th className="text-left px-6 py-4">Espacios</th>
                <th className="text-left px-6 py-4">Estado</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {listSessions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    No hay sesiones programadas para este día
                  </td>
                </tr>
              )}
              {listSessions
                .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
                .map(s => (
                  <tr key={s.id} className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-4 text-gray-300 whitespace-nowrap">
                      {format(toMexicoTime(s.starts_at), "hh:mm aa", { locale: es })}
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{s.class_types?.name}</td>
                    <td className="px-6 py-4 text-gray-400">{s.instructors?.name ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-400">
                      {s.session_availability?.spots_left ?? '—'} / {s.capacity}
                    </td>
                    <td className="px-6 py-4">
                      {s.is_cancelled
                        ? <span className="text-xs font-semibold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full">Cancelada</span>
                        : <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full">Activa</span>
                      }
                    </td>
                    <td className="px-6 py-4">
                      {!s.is_cancelled && (
                        <button
                          onClick={() => setSelectedSession(s)}
                          className="text-blue-400 hover:text-blue-300 transition-colors mr-3"
                        >
                          Ver detalles
                        </button>
                      )}
                      {!s.is_cancelled && (
                        <button
                          onClick={() => handleCancel(s.id)}
                          className="text-gray-500 hover:text-red-400 transition-colors"
                        >
                          
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Session detail modal ── */}
      {selectedSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setSelectedSession(null)}
        >
          <div
            className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-sm p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-white text-lg">
                  {selectedSession.class_types?.name}
                </h3>
                <p className="text-gray-400 text-sm mt-0.5">
                  {format(toMexicoTime(selectedSession.starts_at), "EEEE d MMMM · hh:mm aa", { locale: es })}
                </p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-1 rounded-full hover:bg-gray-800"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex flex-col gap-2 bg-gray-800 rounded-xl p-4 mb-5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Instructor</span>
                <span className="text-white">{selectedSession.instructors?.name ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ubicación</span>
                <span className="text-white">{selectedSession.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Capacidad</span>
                <span className="text-white">
                  {selectedSession.session_availability?.spots_left ?? '—'} / {selectedSession.capacity} espacios
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Estado</span>
                <span className={selectedSession.is_cancelled ? 'text-red-400' : 'text-green-400'}>
                  {selectedSession.is_cancelled ? 'Cancelada' : 'Activa'}
                </span>
              </div>
            </div>

            {!selectedSession.is_cancelled && (
              <button
                onClick={() => handleCancel(selectedSession.id)}
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold py-3 rounded-xl text-sm transition-colors border border-red-500/20"
              >
                <Trash2 className="w-4 h-4" />
                Cancelar sesión
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}