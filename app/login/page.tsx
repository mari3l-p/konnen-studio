'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// Añadimos el nuevo modo 'forgot_password'
type Mode = 'login' | 'register' | 'forgot_password'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  
  const [fullName, setFullName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === 'login') {
      // --- LÓGICA DE LOGIN ---
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Correo o contraseña incorrectos')
      } else {
        router.push('/dashboard')
        router.refresh()
      }

    } else if (mode === 'register') {
      // --- LÓGICA DE REGISTRO ---
      if (!fullName.trim()) {
        setError('Por favor ingresa tu nombre completo')
        setLoading(false)
        return
      }
      if (!birthday) {
        setError('Por favor ingresa tu fecha de nacimiento')
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            full_name: fullName,
            birthday: birthday 
          },
          emailRedirectTo: `${window.location.origin}/auth/callback-client`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess('Revisa tu correo para confirmar tu cuenta.')
      }

    } else if (mode === 'forgot_password') {
      // --- LÓGICA DE RECUPERACIÓN DE CONTRASEÑA ---
      if (!email) {
        setError('Por favor, ingresa tu correo electrónico.')
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/actualizar-contrasena`, 
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess('Te hemos enviado un enlace de recuperación. Revisa tu correo.')
        setMode('login') // Lo regresamos a login después de pedir el enlace
      }
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f4f7fa] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-8">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center mb-3">
            <span className="text-black font-extrabold text-sm">Kn</span>
          </div>
          <h1 className="text-gray-900 text-xl font-bold">Können</h1>
          <p className="text-gray-400 text-sm mt-1">
            {mode === 'login' && 'Inicia sesión en tu cuenta'}
            {mode === 'register' && 'Crea tu cuenta'}
            {mode === 'forgot_password' && 'Recupera tu contraseña'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Campos exclusivos de Registro */}
          {mode === 'register' && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 font-medium">Nombre completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Juan López"
                  required
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 font-medium">Fecha de nacimiento</label>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  required
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors text-gray-700"
                />
              </div>
            </>
          )}

          {/* Campo de Email (Visible en los 3 modos) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan@ejemplo.com"
              required
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Campo de Contraseña (Visible solo en Login y Registro) */}
          {mode !== 'forgot_password' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs text-gray-500 font-medium">Contraseña</label>
                
                {/* Botón de Olvidé mi contraseña (Solo visible en Login) */}
                {mode === 'login' && (
                  <button 
                    type="button" 
                    onClick={() => { setMode('forgot_password'); setError(null); setSuccess(null); }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          )}

          {/* Mensajes de Error / Éxito */}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors mt-1"
          >
            {loading ? 'Cargando...' : (
              mode === 'login' ? 'Iniciar sesión' : 
              mode === 'register' ? 'Crear cuenta' : 
              'Enviar enlace'
            )}
          </button>
        </form>

        {/* Toggle mode inferior */}
        <div className="text-center mt-6">
          {mode === 'forgot_password' ? (
            <button
              onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
              className="text-sm text-blue-600 font-semibold hover:underline"
            >
              Volver al inicio de sesión
            </button>
          ) : (
            <p className="text-sm text-gray-500">
              {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); setSuccess(null); }}
                className="text-blue-600 font-semibold hover:underline"
              >
                {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  )
}