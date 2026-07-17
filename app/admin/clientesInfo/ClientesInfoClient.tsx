'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Edit2, X, Eye, History } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function ClientesInfoClient({ initialProfiles }: { initialProfiles: any[] }) {
  const [profiles, setProfiles] = useState(initialProfiles)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingPackage, setEditingPackage] = useState<any>(null)
  const [editForm, setEditForm] = useState({ classes_remaining: 0, expires_at: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [viewingProfile, setViewingProfile] = useState<any>(null)
  const [viewingHistory, setViewingHistory] = useState<any>(null)
  const [historyBookings, setHistoryBookings] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const filteredProfiles = profiles.filter((p) => {
    const search = searchTerm.toLowerCase()
    return (p.full_name?.toLowerCase().includes(search) || p.email?.toLowerCase().includes(search))
  })

  const handleEditClick = (userPackage: any, profileName: string) => {
    const dateObj = new Date(userPackage.expires_at)
    const localDateTime = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    setEditForm({ classes_remaining: userPackage.classes_remaining, expires_at: localDateTime })
    setEditingPackage({ ...userPackage, profileName })
  }

  const handleSave = async () => {
    if (!editingPackage) return
    setIsSaving(true)
    const newExpiresAtIso = new Date(editForm.expires_at).toISOString()
    
    const { error } = await supabase.from('user_packages')
      .update({ classes_remaining: editForm.classes_remaining, expires_at: newExpiresAtIso })
      .eq('id', editingPackage.id)

    if (error) { alert('Error: ' + error.message); setIsSaving(false); return }

    // Actualizar estado local reflejando los cambios tanto en la lista principal como en el modal abierto
    setProfiles(prev => prev.map(p => ({
      ...p,
      user_packages: p.user_packages?.map((up: any) => up.id === editingPackage.id ? { ...up, classes_remaining: editForm.classes_remaining, expires_at: newExpiresAtIso } : up)
    })))

    if (viewingProfile) {
      setViewingProfile((prev: any) => ({
        ...prev,
        user_packages: prev.user_packages?.map((up: any) => up.id === editingPackage.id ? { ...up, classes_remaining: editForm.classes_remaining, expires_at: newExpiresAtIso } : up)
      }))
    }
    
    setEditingPackage(null)
    setIsSaving(false)
  }

  const handleViewHistory = async (profile: any) => {
    setViewingHistory(profile)
    setLoadingHistory(true)

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        created_at,
        sessions ( starts_at, class_types ( name ) ),
        user_packages ( packages ( title ) )
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })

    if (error) {
      alert('Error al cargar historial: ' + error.message)
      setHistoryBookings([])
    } else {
      setHistoryBookings(data || [])
    }
    setLoadingHistory(false)
  }

  // Lógica para separar paquetes del cliente visualizado
  const now = new Date()
  const activePackages = viewingProfile?.user_packages?.filter((up: any) => {
    return up.status === 'active' && up.classes_remaining > 0 && new Date(up.expires_at) > now
  }) || []

  const inactivePackages = viewingProfile?.user_packages?.filter((up: any) => {
    return up.status !== 'active' || up.classes_remaining <= 0 || new Date(up.expires_at) <= now
  }) || []

  return (
    <div className="flex flex-col gap-4">
      {/* Buscador */}
      <div className="relative w-full max-w-md">
        <input
          type="text"
          placeholder="Buscar por nombre o correo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 text-white text-sm rounded-lg pl-4 pr-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Tabla de Clientes */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-widest bg-gray-900/50">
              <th className="text-left px-6 py-4">Cliente</th>
              <th className="text-right px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProfiles.map((profile) => (
              <tr key={profile.id} className="border-b border-gray-800 hover:bg-gray-800/40">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-white font-medium cursor-pointer hover:text-blue-400 transition-colors" onClick={() => setViewingProfile(profile)}>
                      {profile.full_name || 'Sin nombre'}
                    </span>
                    <span className="text-gray-500 text-[11px]">{profile.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => setViewingProfile(profile)} className="p-2 text-gray-400 hover:text-white transition-colors" title="Ver paquetes"><Eye size={16} /></button>
                  <button onClick={() => handleViewHistory(profile)} className="p-2 text-gray-400 hover:text-white transition-colors" title="Ver historial de reservas"><History size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Información Completa del Cliente */}
      {viewingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            className="bg-black border border-gray-800 rounded-2xl w-full max-w-md p-6 flex flex-col gap-6"
            style={{ maxHeight: '85vh', overflowY: 'auto' }}
          >
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{viewingProfile.full_name}</h3>
                <p className="text-xs text-gray-500">{viewingProfile.email}</p>
              </div>
              <button onClick={() => setViewingProfile(null)}><X size={20} className="text-gray-500 hover:text-white transition-colors" /></button>
            </div>

            {/* SECCIÓN 1: PAQUETES ACTIVOS */}
            <div>
              <h4 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 block"></span>
                Paquetes Activos ({activePackages.length})
              </h4>
              <div className="flex flex-col gap-2">
                {activePackages.length === 0 ? (
                  <p className="text-xs text-gray-500 italic bg-black/25 border border-gray-800/50 rounded-lg p-3">No hay paquetes activos actualmente.</p>
                ) : (
                  activePackages.map((up: any) => (
                    <div key={up.id} className="bg-black border border-gray-800 p-4 rounded-lg flex justify-between items-center hover:border-gray-700 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-white">{up.packages?.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          <span className="text-blue-400 font-bold">{up.classes_remaining} créditos</span> · Vence {format(new Date(up.expires_at), "dd MMM yyyy", { locale: es })}
                        </p>
                      </div>
                      <button onClick={() => handleEditClick(up, viewingProfile.full_name)} className="p-2 text-blue-400 hover:bg-blue-900/20 rounded-full transition-colors">
                        <Edit2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SECCIÓN 2: PAQUETES VENCIDOS / INACTIVOS */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-600 block"></span>
                Historial / Vencidos ({inactivePackages.length})
              </h4>
              <div className="flex flex-col gap-2 pr-1" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {inactivePackages.length === 0 ? (
                  <p className="text-xs text-gray-500 italic bg-black/25 border border-gray-800/50 rounded-lg p-3">Sin historial de paquetes vencidos.</p>
                ) : (
                  inactivePackages.map((up: any) => (
                    <div key={up.id} className="bg-black/40 border border-gray-800/60 p-3 rounded-lg flex justify-between items-center opacity-70 hover:opacity-100 transition-opacity">
                      <div>
                        <p className="text-xs font-medium text-gray-300">{up.packages?.title}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {up.classes_remaining} créditos · Venció {format(new Date(up.expires_at), "dd MMM yyyy", { locale: es })}
                        </p>
                      </div>
                      <button onClick={() => handleEditClick(up, viewingProfile.full_name)} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-full transition-colors">
                        <Edit2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historial de Reservas */}
      {viewingHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            className="bg-black border border-gray-800 rounded-2xl w-full max-w-md p-6 flex flex-col gap-4"
            style={{ maxHeight: '85vh', overflowY: 'auto' }}
          >
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Historial de reservas</h3>
                <p className="text-xs text-gray-500">{viewingHistory.full_name}</p>
              </div>
              <button onClick={() => { setViewingHistory(null); setHistoryBookings([]) }}>
                <X size={20} className="text-gray-500 hover:text-white transition-colors" />
              </button>
            </div>

            {loadingHistory ? (
              <p className="text-xs text-gray-500 italic text-center py-6">Cargando historial...</p>
            ) : historyBookings.length === 0 ? (
              <p className="text-xs text-gray-500 italic bg-black/25 border border-gray-800/50 rounded-lg p-3">
                Este cliente aún no tiene reservas registradas.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {historyBookings.map((booking: any) => {
                  const className = booking.sessions?.class_types?.name ?? 'Clase eliminada'
                  const startsAt = booking.sessions?.starts_at
                  const packageTitle = booking.user_packages?.packages?.title ?? 'Sin paquete asociado'

                  const statusStyles: Record<string, string> = {
                    confirmed: 'bg-green-500/10 text-green-400',
                    cancelled: 'bg-red-500/10 text-red-400',
                  }

                  return (
                    <div key={booking.id} className="bg-black border border-gray-800 p-3 rounded-lg flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-white">{className}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${statusStyles[booking.status] ?? 'bg-gray-500/10 text-gray-400'}`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {startsAt ? format(new Date(startsAt), "d MMM yyyy, HH:mm", { locale: es }) : 'N/A'}
                        </span>
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest bg-gray-900 border border-gray-800 px-2 py-0.5 rounded">
                          {packageTitle}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Editar Paquete */}
      {editingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-6 flex flex-col gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Modificar Créditos</h3>
              <p className="text-xs text-gray-500 mt-0.5">{editingPackage.packages?.title}</p>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 uppercase font-semibold">Créditos Restantes</label>
                <input type="number" value={editForm.classes_remaining} onChange={(e) => setEditForm(prev => ({ ...prev, classes_remaining: parseInt(e.target.value) || 0 }))} className="w-full bg-black border border-gray-800 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 uppercase font-semibold">Fecha de Vencimiento</label>
                <input type="datetime-local" value={editForm.expires_at} onChange={(e) => setEditForm(prev => ({ ...prev, expires_at: e.target.value }))} className="w-full bg-black border border-gray-800 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 [color-scheme:dark]" />
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button onClick={() => setEditingPackage(null)} className="flex-1 py-2 text-sm bg-transparent border border-gray-800 text-gray-400 rounded-lg hover:bg-gray-800 transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={isSaving} className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}