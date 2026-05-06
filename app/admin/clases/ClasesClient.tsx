'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ClassType } from '@/types'
import { useRouter } from 'next/navigation'

export default function ClasesClient({ classTypes: initial }: { classTypes: ClassType[] }) {
  const router = useRouter()
  const [classTypes, setClassTypes] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    duration_mins: 50,
    image_url: '',
  })

  async function handleCreate() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.from('class_types').insert([form])
    if (error) {
      setError(error.message)
    } else {
      router.refresh()
      setShowForm(false)
      setForm({ name: '', duration_mins: 50, image_url: '' })
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('class_types').delete().eq('id', id)
    setClassTypes(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tipos de clase</h1>
          <p className="text-gray-400 text-sm mt-1">Indoor Cycling, Sculpt Deep, Define & Tone</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva clase
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-base font-bold mb-5">Nueva tipo de clase</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Nombre</label>
              <input
                type="text"
                placeholder="Ej: Sculpt Deep"
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Duración (min)</label>
              <input
                type="number"
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white"
                value={form.duration_mins}
                onChange={(e) => setForm({ ...form, duration_mins: Number(e.target.value) })}
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs text-gray-400 uppercase tracking-widest">URL de imagen</label>
              <input
                type="text"
                placeholder="https://..."
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm mt-4">{error}</p>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCreate}
              disabled={loading || !form.name}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              {loading ? 'Guardando...' : 'Crear'}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classTypes.map(ct => (
          <div key={ct.id} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex justify-between items-start">
            <div className="flex items-center gap-4">
              {ct.image_url && (
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-700">
                  <img src={ct.image_url} alt={ct.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <p className="font-semibold text-white">{ct.name}</p>
                <p className="text-gray-400 text-xs mt-1">{ct.duration_mins} min</p>
              </div>
            </div>
            <button
              onClick={() => handleDelete(ct.id)}
              className="text-gray-600 hover:text-red-400 transition-colors ml-4 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}