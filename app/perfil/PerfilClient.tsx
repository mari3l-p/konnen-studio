'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  User, BookOpen, CreditCard, FileText,
  LogOut, Check, Camera, Loader2
} from 'lucide-react'

type Profile = {
  id: string
  full_name: string | null
  email: string | null
  instagram: string | null
  phone: string | null
  avatar_url: string | null
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).slice(0, 2)
    .map(n => n[0].toUpperCase()).join('')
}

const SIDEBAR_LINKS = [
  { label: 'Mi perfil', href: '/perfil', icon: User },
  { label: 'Mis paquetes', href: '/membresias', icon: CreditCard },
  { label: 'Mis reservas', href: '/reservas', icon: BookOpen },
  { label: 'Mis facturas', href: '/facturas', icon: FileText },
]

export default function PerfilClient({ profile }: { profile: Profile | null }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    instagram: profile?.instagram ?? '',
    phone: profile?.phone ?? '',
  })
  
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initials = getInitials(form.full_name || profile?.full_name || null)

  // Función para subir la foto a Supabase Storage
  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)
      setError(null)

      if (!event.target.files || event.target.files.length === 0) return
      if (!profile?.id) return

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${profile.id}-${Math.random()}.${fileExt}`

      // 1. Subir al Bucket "avatars" (asegúrate de que el bucket sea público en Supabase)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // 3. Actualizar tabla profiles
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id)

      if (updateError) throw updateError
      
      router.refresh() // Recargar datos
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!profile?.id) return
    setSaving(true)
    setError(null)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        instagram: form.instagram || null,
        phone: form.phone || null,
      })
      .eq('id', profile.id)

    if (error) {
      setError(error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      router.refresh()
    }
    setSaving(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Se mantiene igual */}
      <aside className="hidden md:flex w-64 shrink-0 bg-white border-r border-gray-100 flex-col">
        <div className="px-6 py-8 border-b border-gray-100 text-center">
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden">
             {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
             ) : (
                <span className="text-white font-bold text-2xl">{initials}</span>
             )}
          </div>
          <p className="font-bold text-gray-900 text-base">{profile?.full_name || 'Usuario'}</p>
          <p className="text-gray-400 text-xs truncate px-2">{profile?.email}</p>
        </div>

        <nav className="flex-1 py-4">
          {SIDEBAR_LINKS.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} className={`flex items-center gap-3 px-6 py-3.5 text-sm transition-all ${href === '/perfil' ? 'bg-blue-50 text-blue-600 font-bold border-r-4 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
              <Icon className="w-4 h-4" /> {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 rounded-xl w-full transition-colors">
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content - Centrado */}
      <main className="flex-1 flex justify-center py-10 px-4">
        <div className="w-full max-w-2xl">
          
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-10 mb-8">
            <h2 className="text-2xl font-black text-gray-900 mb-8">Mi Perfil</h2>

            {/* Avatar Upload */}
            <div className="flex flex-col items-center md:items-start gap-6 mb-10 pb-10 border-b border-gray-50">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center shadow-xl overflow-hidden border-4 border-white">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-3xl">{initials}</span>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 bg-white p-2 rounded-full shadow-md hover:bg-gray-50 transition-all border border-gray-100"
                >
                  <Camera className="w-4 h-4 text-blue-600" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={uploadAvatar} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <div className="text-center md:text-left">
                <h3 className="font-bold text-gray-900">Foto de perfil</h3>
                <p className="text-xs text-gray-400 mt-1">JPG o PNG. Máximo 2MB.</p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                <label className="text-sm font-bold text-gray-700">Nombre Completo</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="md:col-span-2 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all bg-gray-50/50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                <label className="text-sm font-bold text-gray-700">Correo Electrónico</label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="md:col-span-2 border border-gray-100 rounded-2xl px-5 py-3 text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                <label className="text-sm font-bold text-gray-700">Instagram</label>
                <input
                  type="text"
                  placeholder="@tu_usuario"
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  className="md:col-span-2 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all bg-gray-50/50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                <label className="text-sm font-bold text-gray-700">Teléfono</label>
                <input
                  type="tel"
                  placeholder="+52 000 000 0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="md:col-span-2 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all bg-gray-50/50"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-xs mt-6 bg-red-50 p-3 rounded-xl">{error}</p>}

            <div className="flex justify-end mt-10">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-8 py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-blue-200"
              >
                {saved ? <Check className="w-4 h-4" /> : saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saved ? 'Cambios guardados' : saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">Método de pago</h3>
              <p className="text-sm text-gray-400">Gestiona tus tarjetas guardadas</p>
            </div>
            <button className="text-blue-600 text-sm font-bold hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors">
              + Agregar
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}