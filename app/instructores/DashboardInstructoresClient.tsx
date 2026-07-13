'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Plus, X, LogOut, ChevronLeft, ChevronRight, Users, Clock, MapPin } from 'lucide-react'
import { format, addDays, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'

const CLASS_COLORS = [
  { border: '#3b82f6', bg: 'rgba(59,130,246,0.12)', text: '#93c5fd', badge: 'rgba(59,130,246,0.2)' },
  { border: '#a855f7', bg: 'rgba(168,85,247,0.12)', text: '#d8b4fe', badge: 'rgba(168,85,247,0.2)' },
  { border: '#10b981', bg: 'rgba(16,185,129,0.12)', text: '#6ee7b7', badge: 'rgba(16,185,129,0.2)' },
  { border: '#f59e0b', bg: 'rgba(245,158,11,0.12)', text: '#fcd34d', badge: 'rgba(245,158,11,0.2)' },
  { border: '#ec4899', bg: 'rgba(236,72,153,0.12)', text: '#f9a8d4', badge: 'rgba(236,72,153,0.2)' },
  { border: '#06b6d4', bg: 'rgba(6,182,212,0.12)', text: '#67e8f9', badge: 'rgba(6,182,212,0.2)' },
]

export default function DashboardInstructoresClient({
  userEmail, 
  isAdmin, 
  instructorProfile, 
  initialClasses = [], 
  classTypes = [], 
  instructors = [],
}: any) {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [classes, setClasses] = useState(initialClasses)
  const [now, setNow] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date>(new Date())
  const [showForm, setShowForm] = useState(false)
  const [selectedClass, setSelectedClass] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [addingLoading, setAddingLoading] = useState(false)

  const [form, setForm] = useState({
    class_type_id: '',
    instructor_id: isAdmin ? '' : (instructorProfile?.id || ''),
    starts_at: '',
    capacity: 15,
    location: 'Konnen Studio',
  })

  const colorMap: Record<string, typeof CLASS_COLORS[0]> = {}
  classTypes?.forEach((ct: any, i: number) => { colorMap[ct.id] = CLASS_COLORS[i % CLASS_COLORS.length] })

  useEffect(() => {
    setIsMounted(true)
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/instructores/login')
  }

  async function handleCreateSession() {
    if (!form.class_type_id || !form.instructor_id || !form.starts_at) {
      alert('Por favor completa todos los campos requeridos.')
      return
    }
    setLoading(true)
    const startsAtMexico = `${form.starts_at}:00-06:00`
    const { data, error } = await supabase
      .from('sessions')
      .insert([{ ...form, starts_at: startsAtMexico }])
      .select('*, class_types(name, duration_mins), instructors(name)')
    
    if (!error && data) {
      setClasses((prev: any) =>
        [...prev, { ...data[0], availability: null, attendees: [] }]
          .sort((a: any, b: any) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
      )
      setShowForm(false)
      setForm({ ...form, class_type_id: '', starts_at: '' })
      router.refresh()
    } else {
      alert('Error: ' + error?.message)
    }
    setLoading(false)
  }

  async function handleCancelSession(id: string) {
    await supabase.from('sessions').update({ is_cancelled: true }).eq('id', id)
    setClasses((prev: any) => prev.filter((c: any) => c.id !== id))
    closeModal()
  }

  async function handleAddCustomer() {
    if (!newCustomerName.trim()) return
    setAddingLoading(true)

    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          session_id: selectedClass.id,
          guest_name: newCustomerName,
          status: 'confirmed'
        })
        .select('id')
        .single()

      if (error) throw error

      const updatedClasses = classes.map((c: any) => {
        if (c.id === selectedClass.id) {
          const currentBooked = c.availability?.booked_count ?? 0
          const currentCapacity = c.capacity || 15
          
          return {
            ...c,
            attendees: [...(c.attendees || []), { id: data.id, name: newCustomerName }],
            availability: {
              ...c.availability,
              booked_count: currentBooked + 1,
              spots_left: currentCapacity - (currentBooked + 1)
            }
          }
        }
        return c
      })

      setClasses(updatedClasses)
      setSelectedClass(updatedClasses.find((c: any) => c.id === selectedClass.id))
      
      setNewCustomerName('')
      setIsAddingCustomer(false)
    } catch (error: any) {
      alert('Error al agregar el cliente manualmente: ' + error.message)
    } finally {
      setAddingLoading(false)
    }
  }

  async function handleRemoveCustomer(bookingId: string) {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)

      if (error) throw error

      const updatedClasses = classes.map((c: any) => {
        if (c.id === selectedClass.id) {
          const currentBooked = c.availability?.booked_count ?? 0
          const currentCapacity = c.capacity || 15
          
          return {
            ...c,
            attendees: c.attendees.filter((attendee: any) => attendee.id !== bookingId),
            availability: {
              ...c.availability,
              booked_count: Math.max(0, currentBooked - 1),
              spots_left: currentCapacity - Math.max(0, currentBooked - 1)
            }
          }
        }
        return c
      })

      setClasses(updatedClasses)
      setSelectedClass(updatedClasses.find((c: any) => c.id === selectedClass.id))
    } catch (error: any) {
      alert('Error al eliminar la reserva: ' + error.message)
    }
  }

  const closeModal = () => {
    setSelectedClass(null)
    setIsAddingCustomer(false)
    setNewCustomerName('')
  }

  if (!isMounted) return <div style={{ minHeight: '100vh', background: '#000' }} />

  const monthLabel = format(selectedDay, 'MMMM yyyy', { locale: es }).replace(/^\w/, c => c.toUpperCase())

  const dayViewClasses = classes
    ?.filter((c: any) => isSameDay(new Date(c.starts_at), selectedDay))
    ?.sort((a: any, b: any) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#fff' }}>Horarios</h1>
            <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0' }}>
              {isAdmin ? 'Vista de administrador' : `Bienvenida, ${instructorProfile?.name}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={() => setShowForm(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#000', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <Plus size={14} /> Nueva clase
            </button>
            <button
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', color: '#666', border: '1px solid #222', borderRadius: 10, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}
            >
              <LogOut size={14} /> Salir
            </button>
          </div>
        </div>

        {/* Create form */}
        {showForm && (
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Nueva sesión</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
              {[
                { label: 'Clase *', content: (
                  <select style={selectStyle} value={form.class_type_id} onChange={e => setForm({ ...form, class_type_id: e.target.value })}>
                    <option value="">Seleccionar...</option>
                    {classTypes?.map((ct: any) => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
                  </select>
                )},
                { label: 'Instructor *', content: (
                  <select style={{ ...selectStyle, opacity: isAdmin ? 1 : 0.5 }} value={form.instructor_id} disabled={!isAdmin} onChange={e => setForm({ ...form, instructor_id: e.target.value })}>
                    <option value="">Seleccionar...</option>
                    {instructors?.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                )},
                { label: 'Fecha y hora *', content: (
                  <input type="datetime-local" style={{ ...selectStyle, colorScheme: 'dark' }} value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} />
                )},
                { label: 'Capacidad', content: (
                  <input type="number" min={1} style={selectStyle} value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) || 15 })} />
                )},
                { label: 'Ubicación', content: (
                  <input type="text" style={selectStyle} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                )},
              ].map(({ label, content }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
                  {content}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleCreateSession}
                disabled={loading}
                style={{ background: '#fff', color: '#000', border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
              >
                {loading ? 'Creando...' : 'Crear sesión'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                style={{ background: 'none', border: 'none', color: '#666', fontSize: 13, cursor: 'pointer', padding: '9px 12px' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Calendar container */}
        <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 16, overflow: 'hidden' }}>

          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #1a1a1a', background: '#111', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', textTransform: 'capitalize' }}>{monthLabel}</span>
              <span style={{ fontSize: 13, color: '#555' }}>
                — {format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => setSelectedDay(new Date())}
                style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid #222', borderRadius: 8, background: 'transparent', color: '#888' }}
              >
                Hoy
              </button>
            </div>
          </div>

          {/* Day nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderBottom: '1px solid #1a1a1a' }}>
            <button onClick={() => setSelectedDay(d => addDays(d, -1))} style={navBtn}>
              <ChevronLeft size={15} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', flex: 1, textAlign: 'center', textTransform: 'capitalize' }}>
              {format(selectedDay, "EEEE d 'de' MMMM yyyy", { locale: es })}
            </span>
            <button onClick={() => setSelectedDay(d => addDays(d, 1))} style={navBtn}>
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Day class list */}
          {dayViewClasses?.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#333' }}>
              <p style={{ margin: 0, fontSize: 14 }}>No hay clases programadas para este día</p>
              <button
                onClick={() => setShowForm(true)}
                style={{ marginTop: 16, background: '#fff', color: '#000', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                + Agregar clase
              </button>
            </div>
          ) : (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {dayViewClasses?.map((cls: any) => {
                const startDate = new Date(cls.starts_at)
                const isPast = startDate.getTime() < now.getTime()
                
                const baseColor = colorMap[cls.class_type_id] ?? CLASS_COLORS[0]
                const color = isPast 
                  ? { border: '#333', bg: '#0a0a0a', text: '#666', badge: '#1a1a1a' }
                  : baseColor

                const booked = cls.availability?.booked_count ?? 0
                const spots = cls.availability?.spots_left ?? cls.capacity

                return (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      background: color.bg, border: '1px solid #1a1a1a',
                      borderLeft: `4px solid ${color.border}`,
                      borderRadius: '0 12px 12px 0',
                      padding: '14px 18px', cursor: 'pointer', textAlign: 'left', width: '100%',
                      opacity: isPast ? 0.6 : 1,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Time */}
                    <div style={{ minWidth: 60 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: isPast ? '#888' : '#fff' }}>
                        {format(startDate, 'h:mm a')}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: '#555' }}>
                        {cls.class_types?.duration_mins ?? 60} min
                      </p>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: isPast ? '#888' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cls.class_types?.name}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cls.instructors?.name} · {cls.location}
                      </p>
                    </div>

                    {/* Spots badge */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      {isPast ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#555', letterSpacing: '0.05em' }}>
                          FINALIZADA
                        </span>
                      ) : (
                        <>
                          <span style={{ fontSize: 13, fontWeight: 700, color: color.text }}>
                            {booked}/{cls.capacity}
                          </span>
                          <span style={{ fontSize: 11, color: spots === 0 ? '#ef4444' : '#555' }}>
                            {spots === 0 ? 'Lleno' : `${spots} disponibles`}
                          </span>
                        </>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Session detail modal */}
      {selectedClass && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={closeModal}
        >
          <div
            style={{ background: '#111', border: '1px solid #222', borderRadius: 20, width: '100%', maxWidth: 380, padding: 24, boxShadow: '0 0 0 1px #333' }}
            onClick={e => e.stopPropagation()}
          >
            {(() => {
              const isPast = new Date(selectedClass.starts_at).getTime() < now.getTime()
              const baseColor = colorMap[selectedClass.class_type_id] ?? CLASS_COLORS[0]
              const color = isPast 
                ? { border: '#333', bg: '#0a0a0a', text: '#666', badge: '#1a1a1a' }
                : baseColor

              const booked = selectedClass.availability?.booked_count ?? 0
              const spots = selectedClass.availability?.spots_left ?? selectedClass.capacity
              
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                      <div style={{ display: 'inline-block', background: color.badge, borderRadius: 6, padding: '3px 10px', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: isPast ? '#888' : color.text }}>
                          {selectedClass.class_types?.name}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: '#555', textTransform: 'capitalize' }}>
                        {format(new Date(selectedClass.starts_at), "EEEE d MMM · h:mm a", { locale: es })}
                      </p>
                    </div>
                    <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: 4 }}>
                      <X size={18} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#0a0a0a', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                    {[
                      { icon: <Users size={13} />, label: 'Instructor', value: selectedClass.instructors?.name ?? '—' },
                      { icon: <Clock size={13} />, label: 'Duración', value: `${selectedClass.class_types?.duration_mins ?? 60} min` },
                      { icon: <MapPin size={13} />, label: 'Ubicación', value: selectedClass.location },
                    ].map(({ icon, label, value }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555' }}>
                          {icon} {label}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: isPast ? '#888' : '#ccc' }}>{value}</span>
                      </div>
                    ))}
                    
                    <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#555' }}>Reservas</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ height: 6, width: 80, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, (booked / (selectedClass.capacity || 1)) * 100)}%`, background: isPast ? '#333' : color.border, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: isPast ? '#888' : '#fff' }}>{booked}/{selectedClass.capacity}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {isPast ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#555', letterSpacing: '0.05em' }}>
                          FINALIZADA
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: spots === 0 ? '#ef4444' : '#22c55e' }}>
                          {spots === 0 ? 'Sin espacios' : `${spots} disponibles`}
                        </span>
                      )}
                    </div>

                    {(selectedClass.attendees?.length > 0 || isAdmin) && (
                      <div style={{ borderTop: '1px solid #1a1a1a', marginTop: 10, paddingTop: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 12, color: '#555', display: 'block' }}>Nombre de la Reserva.</span>
                          
                          {isAdmin && !isPast && spots > 0 && !isAddingCustomer && (
                            <button
                              onClick={() => setIsAddingCustomer(true)}
                              style={{ background: 'transparent', border: '1px solid #333', color: '#ccc', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                              + Agregar
                            </button>
                          )}
                        </div>

                        {selectedClass.attendees?.length > 0 && (
                          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: isAddingCustomer ? 12 : 0 }}>
                            {selectedClass.attendees.map((attendee: any, index: number) => (
                              <li key={attendee.id || index} style={{ fontSize: 13, color: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: color.border }} />
                                  {attendee.name}
                                </div>
                                
                                {/* Botón X solo para el Admin */}
                                {isAdmin && !isPast && (
                                  <button 
                                    onClick={() => handleRemoveCustomer(attendee.id)} 
                                    style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 }}
                                    title="Cancelar reserva"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}

                        {isAdmin && isAddingCustomer && (
                          <div style={{ display: 'flex', gap: 8, marginTop: selectedClass.attendees?.length > 0 ? 10 : 0 }}>
                            <input
                              type="text"
                              placeholder="Nombre del cliente..."
                              value={newCustomerName}
                              onChange={(e) => setNewCustomerName(e.target.value)}
                              style={{ flex: 1, background: '#000', border: '1px solid #333', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#fff', outline: 'none' }}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddCustomer()
                              }}
                            />
                            <button
                              onClick={handleAddCustomer}
                              disabled={addingLoading || !newCustomerName.trim()}
                              style={{ background: '#fff', color: '#000', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: (addingLoading || !newCustomerName.trim()) ? 0.5 : 1 }}
                            >
                              {addingLoading ? '...' : 'Guardar'}
                            </button>
                            <button
                              onClick={() => { setIsAddingCustomer(false); setNewCustomerName(''); }}
                              style={{ background: 'transparent', color: '#666', border: 'none', fontSize: 12, cursor: 'pointer' }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {(isAdmin || selectedClass.instructors?.name === instructorProfile?.name) && !isPast && (
                    <button
                      onClick={() => handleCancelSession(selectedClass.id)}
                      style={{ width: '100%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '11px 0', fontSize: 13, fontWeight: 600, color: '#ef4444', cursor: 'pointer' }}
                    >
                      Cancelar sesión
                    </button>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  background: '#000',
  border: '1px solid #222',
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 13,
  color: '#fff',
  width: '100%',
  outline: 'none',
}

const navBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: '1px solid #222',
  borderRadius: 8,
  padding: '6px 10px',
  color: '#666',
  cursor: 'pointer',
}