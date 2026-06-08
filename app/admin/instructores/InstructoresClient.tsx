'use client'

import { useState } from 'react'
import { Plus, Trash2, Pencil, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Instructor } from '@/types'
import { useRouter } from 'next/navigation'

export default function InstructoresClient({ instructors: initial }: { instructors: Instructor[] }) {
  const router = useRouter()
  const [instructors, setInstructors] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [form, setForm] = useState({ name: '', email: '', bio: '', image_url: '' })
  const [imageFile, setImageFile] = useState<File | null>(null)

  function handleAddNewClick() {
    setForm({ name: '', email: '', bio: '', image_url: '' })
    setImageFile(null)
    setEditingId(null)
    setShowForm(!showForm)
  }

  function handleEditClick(instructor: Instructor) {
    setForm({ 
      name: instructor.name, 
      email: instructor.email || '', 
      bio: instructor.bio || '', 
      image_url: instructor.image_url || '' 
    })
    setImageFile(null)
    setEditingId(instructor.id)
    setShowForm(true)
  }

  function handleCancel() {
    setShowForm(false)
    setEditingId(null)
    setImageFile(null)
    setForm({ name: '', email: '', bio: '', image_url: '' })
  }

  // Función para subir la imagen a Cloudinary con mejor manejo de errores
  async function uploadToCloudinary(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '')

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const errorData = await res.json()
      console.error("Detalles del error de Cloudinary:", errorData)
      throw new Error(`Error de Cloudinary: ${errorData.error?.message || 'Error desconocido'}`)
    }
    
    const data = await res.json()
    return data.secure_url
  }

  async function handleSave() {
    setLoading(true)
    
    try {
      let finalImageUrl = form.image_url

      // Si el usuario seleccionó un archivo nuevo, lo subimos primero
      if (imageFile) {
        finalImageUrl = await uploadToCloudinary(imageFile)
      }

      const dataToSave = {
        name: form.name,
        email: form.email,
        bio: form.bio,
        image_url: finalImageUrl,
      }

      if (editingId) {
        const { error } = await supabase
          .from('instructors')
          .update(dataToSave)
          .eq('id', editingId)
          
        if (!error) {
          setInstructors(prev => prev.map(i => i.id === editingId ? { ...i, ...dataToSave } : i))
          handleCancel()
          router.refresh()
        } else {
          console.error("Error de Supabase al actualizar:", error)
        }
      } else {
        const { data, error } = await supabase
          .from('instructors')
          .insert([dataToSave])
          .select()
          
        if (!error && data) {
          setInstructors(prev => [...prev, data[0]])
          handleCancel()
          router.refresh()
        } else {
          console.error("Error de Supabase al insertar:", error)
        }
      }
    } catch (error: any) {
      console.error("Hubo un error al guardar:", error)
      alert(error.message || "Hubo un problema al guardar el instructor.")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar este instructor?')
    if (!confirmDelete) return

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
          onClick={handleAddNewClick}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo instructor
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-base font-bold mb-5">
            {editingId ? 'Editar instructor' : 'Nuevo instructor'}
          </h2>
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
              <label className="text-xs text-gray-400 uppercase tracking-widest">Correo Electrónico</label>
              <input
                type="email"
                placeholder="example@gmail.com"
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs text-gray-400 uppercase tracking-widest">Foto del instructor</label>
              <div className="flex items-center gap-4 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2">
                <input
                  type="file"
                  accept="image/*"
                  id="image-upload"
                  className="hidden"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
                <label 
                  htmlFor="image-upload" 
                  className="cursor-pointer flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg text-sm text-white transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Elegir imagen
                </label>
                <span className="text-sm text-gray-400 truncate">
                  {imageFile ? imageFile.name : (form.image_url ? 'Imagen actual guardada' : 'Ningún archivo seleccionado')}
                </span>
              </div>
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
              onClick={handleSave}
              disabled={loading || !form.name}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center min-w-[120px]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : (
                editingId ? 'Guardar cambios' : 'Crear'
              )}
            </button>
            <button 
              onClick={handleCancel} 
              disabled={loading}
              className="text-gray-400 hover:text-white px-4 py-2.5 text-sm disabled:opacity-50"
            >
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
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{i.name}</p>
              {i.email && <p className="text-blue-400 text-xs truncate mt-0.5">{i.email}</p>}
              {i.bio && <p className="text-gray-400 text-xs mt-1 line-clamp-2">{i.bio}</p>}
            </div>
            
            <div className="flex items-center gap-3 ml-2 shrink-0">
              <button 
                onClick={() => handleEditClick(i)} 
                className="text-gray-500 hover:text-blue-400 transition-colors"
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDelete(i.id)} 
                className="text-gray-500 hover:text-red-400 transition-colors"
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