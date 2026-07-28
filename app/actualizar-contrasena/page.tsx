'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ActualizarContrasena() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [isReady, setIsReady] = useState(false) // Controla si la sesión es válida

  useEffect(() => {
    let isMounted = true

    async function processRecoveryLink() {
      // 1) Flujo implícito: los tokens llegan en el #hash de la URL
      //    (#access_token=...&refresh_token=...&type=recovery). El
      //    cliente de @supabase/ssr (createBrowserClient) NO los detecta
      //    automáticamente como sí lo hace supabase-js normal — así que
      //    los leemos nosotros mismos y establecemos la sesión a mano.
      if (typeof window !== 'undefined' && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const access_token = hashParams.get('access_token')
        const refresh_token = hashParams.get('refresh_token')

        if (access_token && refresh_token) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          })

          if (!isMounted) return

          if (setSessionError) {
            setError('Tu enlace de recuperación ya expiró o no es válido. Por favor solicita uno nuevo.')
            return
          }

          setIsReady(true)
          setError(null)
          // Limpiamos el hash de la URL para que no quede el token visible
          window.history.replaceState(null, '', window.location.pathname)
          return
        }
      }

      // 2) Respaldo: flujo PKCE con ?code=... por si en algún momento
      //    se usa ese método en vez del implícito.
      const code = searchParams.get('code')
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (!isMounted) return

        if (exchangeError) {
          setError('Tu enlace de recuperación ya expiró o no es válido. Por favor solicita uno nuevo.')
          return
        }

        setIsReady(true)
        setError(null)
        return
      }

      // 3) Último respaldo: revisamos si ya existe una sesión activa
      const { data: { session } } = await supabase.auth.getSession()
      if (isMounted && session) {
        setIsReady(true)
        return
      }

      if (isMounted) {
        setError('Tu enlace de recuperación ya expiró o no es válido. Por favor solicita uno nuevo.')
      }
    }

    processRecoveryLink()

    // Nos seguimos suscribiendo por si el evento llega de forma diferida
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return

        if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
          setIsReady(true)
          setError(null)
        }
      }
    )

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

            {!isReady && !error && (
              <p className="text-gray-400 text-xs">Validando tu enlace...</p>
            )}

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