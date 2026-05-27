'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Trash2, Users, X, Calendar, MapPin } from 'lucide-react'
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
  price: number 
  precio_especial: number | null
  fecha_limite_especial: string | null
  creditos_otorgados: number | null
  dias_validez: number | null
  capacity: number | null
  is_cancelled: boolean
}

type Registro = {
  id: string
  nombre_cliente: string
  email_cliente: string
  estado_pago: string
  created_at: string
}

export default function EventosAdminClient({ events: initial }: { events: Event[] }) {
  const router = useRouter()
  const [events, setEvents] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para ver los registrados
  const [registros, setRegistros] = useState<Registro[]>([])
  const [loadingRegistros, setLoadingRegistros] = useState(false)
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Event | null>(null)

  const [form, setForm] = useState({
    title: '', description: '', image_url: '', starts_at: '', ends_at: '', location: 'Konnen Studio',
    price: '', precio_especial: '', fecha_limite_especial: '', creditos_otorgados: '', dias_validez: '', capacity: '',
  })

  async function handleCreate() {
    setLoading(true)
    setError(null)
    const payload = {
      title: form.title, description: form.description || null, image_url: form.image_url || null,
      starts_at: form.starts_at, ends_at: form.ends_at || null, location: form.location,
      price: form.price ? Number(form.price) : 0, 
      precio_especial: form.precio_especial ? Number(form.precio_especial) : null,
      fecha_limite_especial: form.fecha_limite_especial || null,
      creditos_otorgados: form.creditos_otorgados ? Number(form.creditos_otorgados) : null,
      dias_validez: form.dias_validez ? Number(form.dias_validez) : null,
      capacity: form.capacity ? Number(form.capacity) : null,
    }

    const { error } = await supabase.from('events').insert([payload])
    if (error) {
      setError(error.message)
    } else {
      router.refresh()
      setShowForm(false)
      setForm({
        title: '', description: '', image_url: '', starts_at: '', ends_at: '', location: 'Konnen Studio',
        price: '', precio_especial: '', fecha_limite_especial: '', creditos_otorgados: '', dias_validez: '', capacity: '',
      })
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if(!confirm("¿Estás seguro de cancelar este evento?")) return;
    await supabase.from('events').update({ is_cancelled: true }).eq('id', id)
    setEvents(prev => prev.map(e => e.id === id ? { ...e, is_cancelled: true } : e))
  }

  async function verRegistrados(evento: Event) {
    setEventoSeleccionado(evento)
    setLoadingRegistros(true)
    
    // Solo traemos los pagos completados
    const { data, error } = await supabase
      .from('registros_eventos')
      .select('*')
      .eq('event_id', evento.id)
      .eq('estado_pago', 'completado')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setRegistros(data)
    }
    setLoadingRegistros(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Eventos</h1>
          <p className="text-gray-400 text-sm mt-1">Administra tus talleres y ve quién se ha registrado</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo evento</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 shadow-lg">
          <h2 className="text-base font-bold text-white mb-5">Nuevo evento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Información Básica */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Título</label>
              <input type="text" placeholder="Ej: Taller de Yoga Restaurativo" className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-500" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Fecha y hora inicio</label>
              <input type="datetime-local" className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Fecha y hora fin (opcional)</label>
              <input type="datetime-local" className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Ubicación</label>
              <input type="text" className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Capacidad (opcional)</label>
              <input type="number" min={1} placeholder="Sin límite si se deja vacío" className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-500" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </div>

            {/* Configuración de Precios y Créditos */}
            <div className="col-span-1 md:col-span-2 mt-2 mb-1">
              <h3 className="text-sm font-semibold text-gray-300 border-b border-gray-700 pb-2">Precios y Créditos</h3>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Precio Regular (MXN)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" min={0} placeholder="0 si es gratis" className="bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white w-full placeholder-gray-500" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-emerald-500 uppercase tracking-widest">Precio Especial (Opcional)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" min={0} placeholder="Ej: 1099" className="bg-emerald-900/20 border border-emerald-800/50 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-white w-full placeholder-gray-500/50" value={form.precio_especial} onChange={(e) => setForm({ ...form, precio_especial: e.target.value })} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-emerald-500 uppercase tracking-widest">Límite precio especial</label>
              <input type="datetime-local" className="bg-emerald-900/20 border border-emerald-800/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-white" value={form.fecha_limite_especial} onChange={(e) => setForm({ ...form, fecha_limite_especial: e.target.value })} />
            </div>

            <div className="flex flex-col gap-1.5"></div> {/* Espaciador */}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-blue-400 uppercase tracking-widest">Créditos a Otorgar</label>
              <input type="number" min={0} placeholder="Ej: 12" className="bg-blue-900/20 border border-blue-800/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-500/50" value={form.creditos_otorgados} onChange={(e) => setForm({ ...form, creditos_otorgados: e.target.value })} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-blue-400 uppercase tracking-widest">Días de Validez</label>
              <input type="number" min={0} placeholder="Ej: 21" className="bg-blue-900/20 border border-blue-800/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-500/50" value={form.dias_validez} onChange={(e) => setForm({ ...form, dias_validez: e.target.value })} />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2 mt-2">
              <label className="text-xs text-gray-400 uppercase tracking-widest">URL de imagen (opcional)</label>
              <input type="text" placeholder="https://..." className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-500" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Descripción (opcional)</label>
              <textarea rows={3} placeholder="Describe el evento..." className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-500 resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

          <div className="flex justify-end gap-3 mt-8">
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white px-4 py-2.5 text-sm font-medium transition-colors">
              Cancelar
            </button>
            <button onClick={handleCreate} disabled={loading || !form.title || !form.starts_at} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
              {loading ? 'Guardando...' : 'Crear evento'}
            </button>
          </div>
        </div>
      )}

      {/* Events list */}
      <div className="flex flex-col gap-4">
        {events.length === 0 && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 px-6 py-12 text-center flex flex-col items-center">
            <Calendar className="w-12 h-12 text-gray-700 mb-4" />
            <p className="text-gray-400 font-medium">No hay eventos creados aún</p>
          </div>
        )}
        
        {events.map(event => (
          <div 
            key={event.id} 
            className={`bg-gray-900 rounded-2xl border ${event.is_cancelled ? 'border-red-900/30 opacity-75' : 'border-gray-800 hover:border-gray-700'} p-5 lg:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-colors`}
          >
            {/* Lado izquierdo: Imagen y Detalles */}
            <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center flex-1 min-w-0">
              {event.image_url && (
                <div className="w-full sm:w-32 h-48 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-gray-800 relative">
                  <img src={event.image_url} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
                </div>
              )}
              
              <div className="flex-1 min-w-0 w-full">
                <h3 className="font-bold text-white text-lg truncate mb-1 pr-4">{event.title}</h3>
                
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <p className="truncate">
                    {format(new Date(event.starts_at), "dd MMM yyyy · hh:mm aa", { locale: es })}
                    {event.ends_at && ` → ${format(new Date(event.ends_at), "hh:mm aa", { locale: es })}`}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {event.price > 0 && (
                    <span className="bg-gray-800 text-gray-300 text-xs px-2.5 py-1 rounded-md border border-gray-700 font-medium">
                      Reg: ${event.price}
                    </span>
                  )}
                  {event.precio_especial && event.precio_especial > 0 && (
                    <span className="bg-emerald-900/30 text-emerald-400 text-xs px-2.5 py-1 rounded-md border border-emerald-800/50 font-medium">
                      Esp: ${event.precio_especial}
                    </span>
                  )}
                  {event.creditos_otorgados && event.creditos_otorgados > 0 && (
                    <span className="bg-blue-900/30 text-blue-400 text-xs px-2.5 py-1 rounded-md border border-blue-800/50 font-medium">
                      +{event.creditos_otorgados} Créditos
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Lado derecho: Botones de Acción */}
            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-5 lg:pt-0 border-t lg:border-t-0 border-gray-800 w-full lg:w-auto">
              {!event.is_cancelled && (
                <button
                  onClick={() => verRegistrados(event)}
                  className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors w-full sm:w-auto"
                >
                  <Users className="w-4 h-4" />
                  Ver Registrados
                </button>
              )}
              {event.is_cancelled && (
                <span className="text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg font-semibold w-full sm:w-auto text-center">
                  Evento Cancelado
                </span>
              )}
              {!event.is_cancelled && (
                <button 
                  onClick={() => handleDelete(event.id)} 
                  className="flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2.5 rounded-xl transition-colors shrink-0"
                  title="Cancelar Evento"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Registrados */}
      {eventoSeleccionado && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div>
                <h3 className="text-lg font-bold text-white">Inscritos en el evento</h3>
                <p className="text-sm text-gray-400">{eventoSeleccionado.title}</p>
              </div>
              <button 
                onClick={() => setEventoSeleccionado(null)}
                className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {loadingRegistros ? (
                <p className="text-center text-gray-400 py-10">Cargando lista...</p>
              ) : registros.length === 0 ? (
                <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-800 border-dashed">
                  <Users className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">Aún no hay registros confirmados.</p>
                  <p className="text-gray-500 text-sm mt-1">Los pagos completados aparecerán aquí.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center mb-2 px-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total: {registros.length}</span>
                  </div>
                  {registros.map((registro, i) => (
                    <div key={registro.id} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 flex justify-between items-center hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-900/40 text-blue-400 flex items-center justify-center font-bold text-sm">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-200">{registro.nombre_cliente}</p>
                          <p className="text-xs text-gray-400">{registro.email_cliente}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Pagado
                        </span>
                        <p className="text-[10px] text-gray-500 mt-1">
                          {format(new Date(registro.created_at), "d MMM, hh:mm a", { locale: es })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}