'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, Camera, Loader2, Lock } from 'lucide-react'
import ProfileLayout from './ProfileLayout'

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

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)
      setError(null)

      if (!event.target.files || event.target.files.length === 0) return
      if (!profile?.id) return

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${profile.id}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id)

      if (updateError) throw updateError

      router.refresh()
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

  return (
    <ProfileLayout profile={profile}>

      {/* Profile card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-10 mb-6">
        <h2 className="text-2xl font-black text-gray-900 mb-8">Mi Perfil</h2>

        {/* Avatar upload */}
        <div className="flex flex-col items-center md:items-start gap-4 mb-10 pb-10 border-b border-gray-100">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center shadow-xl overflow-hidden border-4 border-white">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-3xl">{initials}</span>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
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

        {/* Form */}
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

          {/* NUEVA SECCIÓN DE SEGURIDAD */}
          <div className="pt-6 mt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 items-center gap-2">
            <label className="text-sm font-bold text-gray-700">Seguridad</label>
            <div className="md:col-span-2 flex items-center">
              <Link 
                href="/actualizar-contrasena"
                className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-4 py-2.5 rounded-xl hover:bg-blue-100"
              >
                <Lock className="w-4 h-4" />
                Cambiar contraseña
              </Link>
            </div>
          </div>

        </div>

        {error && (
          <p className="text-red-500 text-xs mt-6 bg-red-50 p-3 rounded-xl">{error}</p>
        )}

        <div className="flex justify-end mt-10">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-8 py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-blue-200"
          >
            {saved
              ? <><Check className="w-4 h-4" /> Cambios guardados</>
              : saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
              : 'Guardar cambios'
            }
          </button>
        </div>
      </div>

    </ProfileLayout>
  )
}