'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Instructor } from '@/types'
import { useRouter } from 'next/navigation'

export default function InstructoresClient({ instructors: initial }: { instructors: Instructor[] }) {
  const router = useRouter()
  const [instructors, setInstructors] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', bio: '', image_url: '' })

  async function handleCreate() {
    setLoading(true)
    const { error } = await supabase.from('instructors').insert([form])
    if (!error) { router.refresh(); setShowForm(false); setForm({ name: '', bio: '', image_url: '' }) }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('instructors').delete().eq('id', id)
    setInstructors(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Instructores</h1>
          <p className="text-gray-400 text-sm mt-1">Gestiona el equipo de instructores</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo instructor
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-base font-bold mb-5">Nuevo instructor</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Nombre</label>
              <input
                type="text"
                placeholder="Ej: Andrea López"
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">URL de foto</label>
              <input
                type="text"
                placeholder="https://..."
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Bio</label>
              <textarea
                rows={3}
                placeholder="Especialidad, experiencia..."
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-500 resize-none"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCreate}
              disabled={loading || !form.name}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              {loading ? 'Guardando...' : 'Crear'}
            </button>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white px-4 py-2.5 text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {instructors.map(i => (
          <div key={i.id} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center shrink-0 overflow-hidden">
              {i.image_url
                ? <img src={i.image_url} alt={i.name} className="w-full h-full object-cover" />
                : <span className="text-white font-bold text-sm">{i.name[0]}</span>
              }
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white">{i.name}</p>
              {i.bio && <p className="text-gray-400 text-xs mt-1 line-clamp-2">{i.bio}</p>}
            </div>
            <button onClick={() => handleDelete(i.id)} className="text-gray-600 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}