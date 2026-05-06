'use client'

import { useState } from 'react'
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Package = {
  id: string
  title: string
  validity: string
  class_type: string
  price: number
  note: string | null
  is_active: boolean
  sort_order: number
}

const EMPTY_FORM = {
  title: '',
  validity: '',
  class_type: '',
  price: '',
  note: '',
}

export default function PaquetesAdminClient({ packages: initial }: { packages: Package[] }) {
  const router = useRouter()
  const [packages, setPackages] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  function update(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleCreate() {
    setLoading(true)
    setError(null)

    const { error } = await supabase.from('packages').insert([{
      title: form.title,
      validity: form.validity,
      class_type: form.class_type,
      price: Number(form.price),
      note: form.note || null,
      sort_order: packages.length + 1,
    }])

    if (error) {
      setError(error.message)
    } else {
      router.refresh()
      setShowForm(false)
      setForm(EMPTY_FORM)
    }
    setLoading(false)
  }

  async function handleToggle(id: string, current: boolean) {
    await supabase.from('packages').update({ is_active: !current }).eq('id', id)
    setPackages(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p))
  }

  async function handleDelete(id: string) {
    await supabase.from('packages').delete().eq('id', id)
    setPackages(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Paquetes</h1>
          <p className="text-gray-400 text-sm mt-1">Gestiona los paquetes y membresías</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo paquete
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-base font-bold mb-6">Nuevo paquete</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Title */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Título</label>
              <input
                type="text"
                placeholder="Ej: First Class!, Flow, Können Core..."
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
              />
            </div>

            {/* Validity */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Vigencia</label>
              <input
                type="text"
                placeholder="Ej: 1 semana, 15 días, 30 días..."
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
                value={form.validity}
                onChange={(e) => update('validity', e.target.value)}
              />
            </div>

            {/* Class type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Tipo de clase</label>
              <select
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white"
                value={form.class_type}
                onChange={(e) => update('class_type', e.target.value)}
              >
                <option value="">Seleccionar...</option>
                <option value="Sculpt / Tone">Sculpt / Tone</option>
                <option value="Indoor Cycling">Indoor Cycling</option>
                <option value="Todas las disciplinas">Todas las disciplinas</option>
              </select>
            </div>

            {/* Price */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Precio (MXN)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  className="bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white w-full placeholder-gray-500"
                  value={form.price}
                  onChange={(e) => update('price', e.target.value)}
                />
              </div>
            </div>

            {/* Note */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs text-gray-400 uppercase tracking-widest">
                Nota adicional <span className="normal-case text-gray-600">(opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ej: Máx. 14 clases de bici, incluye calentamiento..."
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
                value={form.note}
                onChange={(e) => update('note', e.target.value)}
              />
            </div>

          </div>

          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCreate}
              disabled={loading || !form.title || !form.validity || !form.class_type || !form.price}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              {loading ? 'Guardando...' : 'Crear paquete'}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
              className="text-gray-400 hover:text-white px-4 py-2.5 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-widest">
              <th className="text-left px-6 py-4">Título</th>
              <th className="text-left px-6 py-4">Vigencia</th>
              <th className="text-left px-6 py-4">Tipo de clase</th>
              <th className="text-left px-6 py-4">Precio</th>
              <th className="text-left px-6 py-4">Estado</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody>
            {packages.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  No hay paquetes creados aún
                </td>
              </tr>
            )}
            {packages.map(p => (
              <tr key={p.id} className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-white">{p.title}</p>
                  {p.note && <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{p.note}</p>}
                </td>
                <td className="px-6 py-4 text-gray-400">{p.validity}</td>
                <td className="px-6 py-4 text-gray-400">{p.class_type}</td>
                <td className="px-6 py-4 text-gray-300 font-medium">${p.price.toLocaleString()} MXN</td>
                <td className="px-6 py-4">
                  {p.is_active
                    ? <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full">Activo</span>
                    : <span className="text-xs font-semibold text-gray-500 bg-gray-500/10 px-2.5 py-1 rounded-full">Inactivo</span>
                  }
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggle(p.id, p.is_active)}
                      className="text-gray-500 hover:text-blue-400 transition-colors"
                      title={p.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {p.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}