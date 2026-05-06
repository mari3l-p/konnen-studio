'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Event = {
  id: string
  title: string
  description: string | null
  image_url: string | null
  starts_at: string
  ends_at: string | null
  location: string
  price_cents: number
  capacity: number | null
  is_cancelled: boolean
}

export default function EventosAdminClient({ events: initial }: { events: Event[] }) {
  const router = useRouter()
  const [events, setEvents] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    image_url: '',
    starts_at: '',
    ends_at: '',
    location: 'Konnen Studio',
    price_cents: 0,
    capacity: '',
  })

  async function handleCreate() {
    setLoading(true)
    setError(null)

    const payload = {
      title: form.title,
      description: form.description || null,
      image_url: form.image_url || null,
      starts_at: form.starts_at,
      ends_at: form.ends_at || null,
      location: form.location,
      price_cents: Number(form.price_cents),
      capacity: form.capacity ? Number(form.capacity) : null,
    }

    const { error } = await supabase.from('events').insert([payload])
    if (error) {
      setError(error.message)
    } else {
      router.refresh()
      setShowForm(false)
      setForm({
        title: '', description: '', image_url: '',
        starts_at: '', ends_at: '', location: 'Konnen Studio',
        price_cents: 0, capacity: '',
      })
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('events').update({ is_cancelled: true }).eq('id', id)
    setEvents(prev => prev.map(e => e.id === id ? { ...e, is_cancelled: true } : e))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Eventos</h1>
          <p className="text-gray-400 text-sm mt-1">Talleres, eventos especiales y más</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo evento
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-base font-bold mb-5">Nuevo evento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Título</label>
              <input
                type="text"
                placeholder="Ej: Taller de Yoga Restaurativo"
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Fecha y hora inicio</label>
              <input
                type="datetime-local"
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Fecha y hora fin (opcional)</label>
              <input
                type="datetime-local"
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white"
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
              />
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

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Precio (MXN)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  min={0}
                  className="bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white w-full"
                  value={form.price_cents}
                  onChange={(e) => setForm({ ...form, price_cents: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Capacidad (opcional)</label>
              <input
                type="number"
                min={1}
                placeholder="Sin límite si se deja vacío"
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs text-gray-400 uppercase tracking-widest">URL de imagen (opcional)</label>
              <input
                type="text"
                placeholder="https://..."
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Descripción (opcional)</label>
              <textarea
                rows={3}
                placeholder="Describe el evento..."
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-500 resize-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCreate}
              disabled={loading || !form.title || !form.starts_at}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              {loading ? 'Guardando...' : 'Crear evento'}
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

      {/* Events list */}
      <div className="flex flex-col gap-4">
        {events.length === 0 && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 px-6 py-10 text-center text-gray-500">
            No hay eventos creados aún
          </div>
        )}
        {events.map(event => (
          <div
            key={event.id}
            className="bg-gray-900 rounded-2xl border border-gray-800 p-5 flex items-start justify-between gap-4"
          >
            <div className="flex gap-4 items-start">
              {event.image_url && (
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-700">
                  <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <p className="font-semibold text-white">{event.title}</p>
                <p className="text-gray-400 text-xs mt-1">
                  {format(new Date(event.starts_at), "dd MMM yyyy · hh:mm aa", { locale: es })}
                  {event.ends_at && ` → ${format(new Date(event.ends_at), "hh:mm aa", { locale: es })}`}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">{event.location}</p>
                {event.price_cents > 0 && (
                  <p className="text-gray-400 text-xs mt-0.5">${event.price_cents} MXN</p>
                )}
                {event.description && (
                  <p className="text-gray-500 text-xs mt-2 line-clamp-2">{event.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {event.is_cancelled && (
                <span className="text-xs text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full font-semibold">
                  Cancelado
                </span>
              )}
              {!event.is_cancelled && (
                <button
                  onClick={() => handleDelete(event.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}