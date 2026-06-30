'use client'

import { useState } from 'react'
import { Plus, Trash2, Pencil, UploadCloud, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Disciplina } from '@/types'
import { useRouter } from 'next/navigation'

// TODO: Reemplaza estos valores con los de tu cuenta de Cloudinary
const CLOUDINARY_CLOUD_NAME = 'drflwwqi8' 
const CLOUDINARY_UPLOAD_PRESET = 'konnen_instructors' // Asegúrate de que sea "Unsigned"

export default function DisciplinasClient({ initialData }: { initialData: Disciplina[] }) {
  const router = useRouter()
  const [disciplinas, setDisciplinas] = useState(initialData || [])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false) // Nuevo estado para la carga de imagen
  const [error, setError] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    extra: '',
    image_url: '',
    object_position: 'center center'
  })

  function resetForm() {
    setForm({ title: '', description: '', extra: '', image_url: '', object_position: 'center center' })
    setEditingId(null)
    setShowForm(false)
    setError(null)
  }

  function handleEdit(d: Disciplina) {
    setForm({
      title: d.title,
      description: d.description,
      extra: d.extra || '',
      image_url: d.image_url,
      object_position: d.object_position || 'center center'
    })
    setEditingId(d.id)
    setShowForm(true)
  }

  // Nueva función para manejar la subida a Cloudinary
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (data.secure_url) {
        setForm(prev => ({ ...prev, image_url: data.secure_url }))
      } else {
        setError('Error al subir la imagen a Cloudinary.')
      }
    } catch (err) {
      setError('Error de red al intentar subir la imagen.')
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)

    const payload = {
        ...form,
        extra: form.extra.trim() === '' ? null : form.extra
    }

    if (editingId) {
      const { error: updateError } = await supabase.from('disciplinas').update(payload).eq('id', editingId)
      if (updateError) setError(updateError.message)
      else {
        setDisciplinas(prev => prev.map(d => d.id === editingId ? { ...d, ...payload } : d))
        resetForm()
        router.refresh()
      }
    } else {
      const { data, error: insertError } = await supabase.from('disciplinas').insert([payload]).select()
      if (insertError) setError(insertError.message)
      else if (data) {
        setDisciplinas(prev => [...prev, data[0]])
        resetForm()
        router.refresh()
      }
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('disciplinas').delete().eq('id', id)
    if (!error) {
      setDisciplinas(prev => prev.filter(d => d.id !== id))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Disciplinas</h1>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Nueva Disciplina
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-base font-bold mb-5">{editingId ? 'Editar Disciplina' : 'Nueva Disciplina'}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Título</label>
              <input type="text" className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Texto Extra (Opcional)</label>
              <input type="text" placeholder="Ej: Alta tensión profunda" className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white" value={form.extra} onChange={e => setForm({...form, extra: e.target.value})} />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Descripción</label>
              <textarea rows={3} className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>

            {/* ZONA DE CARGA DE IMAGEN */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Imagen de la disciplina</label>
              
              <div className="flex items-center gap-4">
                {/* Botón personalizado para subir */}
                <label className="flex items-center justify-center gap-2 bg-gray-800 border border-dashed border-gray-600 hover:border-blue-500 hover:bg-gray-800/80 transition-all rounded-xl px-4 py-3 text-sm cursor-pointer w-full md:w-auto text-gray-300">
                  {uploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      Seleccionar imagen
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload} 
                    disabled={uploadingImage}
                  />
                </label>

                {/* Preview de la imagen */}
                {form.image_url && (
                  <div className="h-12 w-20 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                    <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Alineación de Imagen</label>
              <select className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white" value={form.object_position} onChange={e => setForm({...form, object_position: e.target.value})}>
                <option value="center center">Centro</option>
                <option value="center top">Arriba</option>
                <option value="center bottom">Abajo</option>
              </select>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

          <div className="flex gap-3 mt-6">
            <button onClick={handleSubmit} disabled={loading || uploadingImage || !form.title || !form.image_url} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={resetForm} className="text-gray-400 hover:text-white px-4 py-2.5 text-sm transition-colors">Cancelar</button>
          </div>
        </div>
      )}

      {/* Lista de disciplinas (Sin cambios) */}
      <div className="grid grid-cols-1 gap-4">
        {disciplinas.map(d => (
          <div key={d.id} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-20 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-700 relative">
                <img src={d.image_url} alt={d.title} className="w-full h-full object-cover" style={{ objectPosition: d.object_position }} />
              </div>
              <div>
                <p className="font-semibold text-white">{d.title}</p>
                <p className="text-gray-400 text-xs mt-1 line-clamp-1 max-w-lg">{d.description}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleEdit(d)} className="text-gray-600 hover:text-blue-400 transition-colors"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(d.id)} className="text-gray-600 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}