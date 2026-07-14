'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Edit2, X, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function ClientesInfoClient({ initialProfiles }: { initialProfiles: any[] }) {
  const [profiles, setProfiles] = useState(initialProfiles)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingPackage, setEditingPackage] = useState<any>(null)
  const [editForm, setEditForm] = useState({ classes_remaining: 0, expires_at: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [viewingProfile, setViewingProfile] = useState<any>(null)

  const filteredProfiles = profiles.filter((p) => {
    const search = searchTerm.toLowerCase()
    return (
      (p.full_name && p.full_name.toLowerCase().includes(search)) ||
      (p.email && p.email.toLowerCase().includes(search))
    )
  })

  const handleEditClick = (userPackage: any, profileName: string) => {
    const dateObj = new Date(userPackage.expires_at)
    const localDateTime = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)

    setEditForm({
      classes_remaining: userPackage.classes_remaining,
      expires_at: localDateTime,
    })
    setEditingPackage({ ...userPackage, profileName })
  }

  const handleSave = async () => {
    if (!editingPackage) return
    setIsSaving(true)

    try {
      const newExpiresAtIso = new Date(editForm.expires_at).toISOString()
      const { error } = await supabase
        .from('user_packages')
        .update({
          classes_remaining: editForm.classes_remaining,
          expires_at: newExpiresAtIso,
        })
        .eq('id', editingPackage.id)

      if (error) throw error

      setProfiles((prev) =>
        prev.map((profile) => ({
          ...profile,
          user_packages: profile.user_packages?.map((up: any) =>
            up.id === editingPackage.id
              ? { ...up, classes_remaining: editForm.classes_remaining, expires_at: newExpiresAtIso }
              : up
          ),
        }))
      )
      setEditingPackage(null)
    } catch (error: any) {
      alert('Error al guardar: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Buscador */}
      <div className="relative w-full max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-gray-500" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre o correo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Tabla de Clientes */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-widest bg-gray-900/50">
              <th className="text-left px-6 py-4">Cliente</th>
              <th className="text-left px-6 py-4">Paquete Actual</th>
              <th className="text-left px-6 py-4">Créditos</th>
              <th className="text-left px-6 py-4">Vencimiento</th>
              <th className="text-left px-6 py-4">Estado</th>
              <th className="text-right px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProfiles.map((profile) => {
              const sortedPackages = profile.user_packages?.sort((a: any, b: any) => new Date(b.expires_at).getTime() - new Date(a.expires_at).getTime())
              const activePackage = sortedPackages?.find((p: any) => p.status === 'active') || sortedPackages?.[0]

              return (
                <tr key={profile.id} className="border-b border-gray-800 hover:bg-gray-800/40">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{profile.full_name || 'Sin nombre'}</span>
                      <span className="text-gray-500 text-[11px]">{profile.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{activePackage?.packages?.title || 'Sin paquete'}</td>
                  <td className="px-6 py-4 font-bold text-blue-400">{activePackage?.classes_remaining ?? '-'}</td>
                  <td className="px-6 py-4 text-gray-400">
                    {activePackage ? format(new Date(activePackage.expires_at), "dd MMM yyyy", { locale: es }) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {activePackage && (
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${activePackage.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {activePackage.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setViewingProfile(profile)} className="p-2 text-gray-400 hover:text-white"><Eye size={16} /></button>
                    <button
                      onClick={() => activePackage && handleEditClick(activePackage, profile.full_name)}
                      disabled={!activePackage}
                      className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Historial */}
      {viewingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Historial de {viewingProfile.full_name}</h3>
              <button onClick={() => setViewingProfile(null)}><X size={20} className="text-gray-500" /></button>
            </div>

            <ul className="flex flex-col gap-3">
              {(viewingProfile.bookings || [])
                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5)
                .map((booking: any) => {
                  // Lógica para determinar el paquete activo asociado al perfil
                  const pkgName = viewingProfile.user_packages?.[0]?.packages?.title || 'Sin paquete'
                  return (
                    <li key={booking.id} className="bg-gray-900/30 border border-gray-800 rounded-lg p-3 flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-white">{booking.sessions?.class_types?.name}</span>
                        <span className="text-[10px] uppercase font-bold text-green-400">{booking.status}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {booking.sessions?.starts_at ? format(new Date(booking.sessions.starts_at), "d MMM, HH:mm", { locale: es }) : 'N/A'}
                        </span>
                        {/* Aquí se muestra el tipo de paquete en letras pequeñas */}
                        <span className="text-[9px] text-gray-600 uppercase tracking-widest bg-black px-2 py-0.5 rounded">
                          {pkgName}
                        </span>
                      </div>
                    </li>
                  )
                })}
            </ul>
          </div>
        </div>
      )}

      {/* Modal Editar Paquete (créditos + vencimiento) */}
      {editingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Editar paquete de {editingPackage.profileName}</h3>
              <button onClick={() => setEditingPackage(null)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 uppercase tracking-widest font-medium">
                  Créditos restantes
                </label>
                <input
                  type="number"
                  min={0}
                  value={editForm.classes_remaining}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      classes_remaining: Math.max(0, parseInt(e.target.value) || 0),
                    }))
                  }
                  className="w-full bg-gray-900 border border-gray-800 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 uppercase tracking-widest font-medium">
                  Fecha de vencimiento
                </label>
                <input
                  type="datetime-local"
                  value={editForm.expires_at}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, expires_at: e.target.value }))
                  }
                  className="w-full bg-gray-900 border border-gray-800 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setEditingPackage(null)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-800 text-gray-400 text-sm font-medium hover:bg-gray-900 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}