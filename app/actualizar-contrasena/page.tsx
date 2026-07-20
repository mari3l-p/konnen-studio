'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ActualizarContrasena() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [isReady, setIsReady] = useState(false) // Controla si la sesión es válida

  useEffect(() => {
    const handleAuth = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        // Intercambio de código por sesión real
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setError('El enlace ha expirado o no es válido.')
        } else {
          setIsReady(true)
        }
      } else {
        // Verificar si ya hay una sesión activa
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setIsReady(true)
        } else {
          setError('Sesión no encontrada. Por favor, abre este enlace en Safari o Chrome.')
        }
      }
    }
    handleAuth()
  }, [])

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard') 
        router.refresh()
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7fa] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-8">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center mb-3">
            <span className="text-black font-extrabold text-sm">Kn</span>
          </div>
          <h1 className="text-gray-900 text-xl font-bold">Können</h1>
          <p className="text-gray-400 text-sm mt-1">Crea tu nueva contraseña</p>
        </div>

        {/* Advertencia para navegadores internos */}
        <div className="mb-6 p-3 bg-amber-50 border border-amber-100 rounded-xl text-[11px] text-amber-700 text-center">
          Si el botón no funciona, toca los tres puntos (...) y selecciona <b>"Abrir en el navegador"</b>.
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-100 text-green-700 p-4 rounded-xl text-center text-sm font-medium">
            ¡Contraseña actualizada con éxito!<br/>
            <span className="font-normal text-green-600 mt-1 block">Redirigiendo...</span>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500 font-medium">Nueva contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading || !isReady}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
            >
              {loading ? 'Actualizando...' : 'Guardar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}