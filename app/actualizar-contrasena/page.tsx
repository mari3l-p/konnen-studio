'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function SolicitarRecuperacion() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Aquí le decimos a Supabase a dónde enviar al usuario después de hacer clic en el correo
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-contrasena`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f4f7fa] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-8">

        {/* Logo y Encabezado */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center mb-3">
            <span className="text-black font-extrabold text-sm">Kn</span>
          </div>
          <h1 className="text-gray-900 text-xl font-bold">Können</h1>
          <p className="text-gray-400 text-sm mt-1">Recupera tu cuenta</p>
        </div>

        {success ? (
          <div className="bg-blue-50 border border-blue-100 text-blue-700 p-4 rounded-xl text-center text-sm">
            Si el correo está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
          </div>
        ) : (
          <form onSubmit={handleResetRequest} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500 font-medium">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
            >
              {loading ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
            </button>

            <div className="text-center mt-2">
              <Link href="/login" className="text-sm text-blue-600 hover:underline">
                Volver al inicio de sesión
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}