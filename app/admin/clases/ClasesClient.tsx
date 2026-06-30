'use client'

import { useState } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ClassType } from '@/types'
import { useRouter } from 'next/navigation'

export default function ClasesClient({ classTypes: initial }: { classTypes: ClassType[] }) {
  const router = useRouter()
  const [classTypes, setClassTypes] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Nuevo estado para rastrear si estamos editando
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    name: '',
    duration_mins: 50,
    image_url: '',
  })

  // Función auxiliar para limpiar y cerrar el formulario
  function resetForm() {
    setForm({ name: '', duration_mins: 50, image_url: '' })
    setEditingId(null)
    setShowForm(false)
    setError(null)
  }

  // Manejador para el botón superior "Nueva clase"
  function handleToggleNewForm() {
    if (showForm && !editingId) {
      resetForm()
    } else {
      resetForm()
      setShowForm(true)
    }
  }

  // Cargar datos en el formulario al darle clic en editar
  function handleEditClick(ct: ClassType) {
    setForm({
      name: ct.name,
      duration_mins: ct.duration_mins,
      image_url: ct.image_url || '',
    })
    setEditingId(ct.id)
    setShowForm(true)
    setError(null)
  }

  // Maneja tanto la creación como la actualización
  async function handleSubmit() {
    setLoading(true)
    setError(null)

    if (editingId) {
      // 1. Lógica de actualización (Edit)
      const { error: updateError } = await supabase
        .from('class_types')
        .update(form)
        .eq('id', editingId)

      if (updateError) {
        setError(updateError.message)
      } else {
        // Actualizamos el estado local para verlo reflejado inmediatamente
        setClassTypes(prev => prev.map(c => c.id === editingId ? { ...c, ...form } : c))
        router.refresh()
        resetForm()
      }
    } else {
      // 2. Lógica de creación (Insert)
      const { data, error: insertError } = await supabase
        .from('class_types')
        .insert([form])
        .select() // Agregamos .select() para poder recibir el ID insertado

      if (insertError) {
        setError(insertError.message)
      } else {
        if (data) {
          setClassTypes(prev => [...prev, data[0]])
        }
        router.refresh()
        resetForm()
      }
    }
    
    setLoading(false)
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('class_types').delete().eq('id', id)
    if (!error) {
      setClassTypes(prev => prev.filter(c => c.id !== id))
      // Si elimina la clase que estaba editando, cierra el formulario
      if (editingId === id) resetForm() 
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tipos de clase</h1>
        </div>
        <button
          onClick={handleToggleNewForm}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva clase
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 transition-all">
          <h2 className="text-base font-bold mb-5">
            {editingId ? 'Editar tipo de clase' : 'Nuevo tipo de clase'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Nombre</label>
              <input
                type="text"
                placeholder="Ej: Indoor ..."
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
              onClick={handleSubmit}
              disabled={loading || !form.name}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              {loading ? 'Guardando...' : (editingId ? 'Actualizar' : 'Crear')}
            </button>
            <button
              onClick={resetForm}
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
            
            {/* Contenedor para los botones de acción */}
            <div className="flex items-center gap-3 ml-4 shrink-0">
              <button
                onClick={() => handleEditClick(ct)}
                className="text-gray-600 hover:text-blue-400 transition-colors"
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(ct.id)}
                className="text-gray-600 hover:text-red-400 transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}