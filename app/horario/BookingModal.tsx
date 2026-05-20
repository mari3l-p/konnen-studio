'use client'

import { useState, useEffect } from 'react'
import { X, Package } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Session } from '@/types'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type UserPackage = {
  id: string
  classes_remaining: number
  expires_at: string
  packages: { title: string; class_type: string }
}

type Props = {
  session: Session
  onClose: () => void
}

export default function BookingModal({ session, onClose }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userPackages, setUserPackages] = useState<UserPackage[]>([])
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [loadingPackages, setLoadingPackages] = useState(true)

  useEffect(() => {
    async function fetchPackages() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoadingPackages(false); return }

      const { data } = await supabase
        .from('user_packages')
        .select('*, packages(title, class_type)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('classes_remaining', 0)
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: true }) // show soonest to expire first

      setUserPackages(data ?? [])
      if (data && data.length > 0) setSelectedPackage(data[0].id)
      setLoadingPackages(false)
    }
    fetchPackages()
  }, [])

  async function handleReserve() {
    if (!selectedPackage) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/bookings/with-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          userPackageId: selectedPackage,
        }),
      })
      const { error: apiError } = await res.json()
      if (apiError) throw new Error(apiError)
      onClose()
      window.location.reload()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">

        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100">
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-1">{session.class_types.name}</h2>
        <p className="text-gray-500 text-sm mb-4">
          {format(new Date(session.starts_at), "EEEE d MMMM · hh:mm aa", { locale: es })}
        </p>

        {/* Session info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Instructor</span>
            <span className="font-medium">{session.instructors?.name ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Duración</span>
            <span className="font-medium">{session.class_types.duration_mins} min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Ubicación</span>
            <span className="font-medium">{session.location}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Espacios disponibles</span>
            <span className="font-medium">{session.session_availability?.spots_left ?? '—'}</span>
          </div>
        </div>

        {/* Package selector or no-package message */}
        {loadingPackages ? (
          <div className="py-4 text-center text-gray-400 text-sm">Cargando paquetes...</div>
        ) : userPackages.length === 0 ? (
          // No active packages — block and redirect
          <div className="flex flex-col gap-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
              <p className="font-semibold text-amber-800 mb-1">
                Necesitas un paquete activo
              </p>
              <p className="text-amber-700">
                Para reservar una clase necesitas adquirir un paquete primero.
              </p>
            </div>
            <button
              onClick={() => { onClose(); router.push('/paquetes') }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              Ver paquetes disponibles
            </button>
            <button
              onClick={onClose}
              className="w-full text-gray-500 hover:text-gray-700 text-sm py-2 transition-colors"
            >
              Cancelar
            </button>
          </div>
        ) : (
          // Has packages — let them pick
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              Selecciona tu paquete
            </p>

            {userPackages.map(up => (
              <button
                key={up.id}
                onClick={() => setSelectedPackage(up.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-colors
                  ${selectedPackage === up.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{up.packages.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{up.packages.class_type}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-blue-600 font-bold text-sm">
                      {up.classes_remaining} {up.classes_remaining === 1 ? 'clase' : 'clases'}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Vence {format(new Date(up.expires_at), "d MMM", { locale: es })}
                    </p>
                  </div>
                </div>
              </button>
            ))}

            {selectedPackage && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
                ✓ Se descontará 1 clase de tu paquete
              </div>
            )}

            {error && (
              <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl">{error}</p>
            )}

            <button
              onClick={handleReserve}
              disabled={loading || !selectedPackage}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Procesando...' : 'Confirmar reserva'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}