'use client'

import { useState, useEffect } from 'react'
import { X, Package, AlertCircle, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type UserPackage = {
  id: string
  classes_remaining: number
  expires_at: string
  packages: {
    title: string
    class_type: string
  }
}

type Props = {
  event: any
  onClose: () => void
  onSuccess: (eventId: string) => void
}

function normalize(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

function isEventCompatible(packageTitle: string): boolean {
  return !normalize(packageTitle).includes('una clase')
}

export default function EventBookingModal({ event, onClose, onSuccess }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [allPackages, setAllPackages] = useState<UserPackage[]>([])
  const [compatiblePackages, setCompatiblePackages] = useState<UserPackage[]>([])
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [loadingPackages, setLoadingPackages] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoadingPackages(false); return }

      const { data } = await supabase
        .from('user_packages')
        .select('*, packages(title, class_type)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('classes_remaining', 0)
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: true })

      const pkgs = data ?? []
      setAllPackages(pkgs)

      const compatible = pkgs.filter(up => isEventCompatible(up.packages.title))
      setCompatiblePackages(compatible)

      if (compatible.length > 0) setSelectedPackage(compatible[0].id)
      setLoadingPackages(false)
    }
    fetchData()
  }, [])

  async function handleReserve() {
    if (!selectedPackage) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/eventos/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          userPackageId: selectedPackage,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Error al procesar el registro')
      }

      setSuccess(true)
      onSuccess(event.id)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const hasNoPackages = !loadingPackages && allPackages.length === 0
  const hasIncompatibleOnly = !loadingPackages && allPackages.length > 0 && compatiblePackages.length === 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative flex flex-col"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100">
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {success ? (
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">¡Ya estás registrado!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Tu lugar en <strong>{event.title}</strong> está confirmado. Nos vemos ahí.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{event.title}</h2>
            <p className="text-gray-500 text-sm mb-4 capitalize">
              {format(new Date(event.starts_at), "EEEE d MMMM · hh:mm aa", { locale: es })}
              {event.ends_at && ` — ${format(new Date(event.ends_at), "hh:mm aa", { locale: es })}`}
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-4 flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Ubicación</span>
                <span className="font-medium">{event.location}</span>
              </div>
              {event.creditos_otorgados > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Créditos otorgados</span>
                  <span className="font-medium text-emerald-600">+{event.creditos_otorgados}</span>
                </div>
              )}
              {event.description && (
                <p className="pt-2 border-t border-gray-100 text-gray-600 leading-relaxed">
                  {event.description}
                </p>
              )}
            </div>

            {loadingPackages ? (
              <div className="py-4 text-center text-gray-400 text-sm">Cargando paquetes...</div>
            ) : hasNoPackages ? (
              <div className="flex flex-col gap-3">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
                  <p className="font-semibold text-amber-800 mb-1">Necesitas un paquete activo</p>
                  <p className="text-amber-700">Para registrarte a este evento necesitas adquirir un paquete primero.</p>
                </div>
                <button onClick={() => { onClose(); router.push('/paquetes') }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                  Ver paquetes disponibles
                </button>
                <button onClick={onClose} className="w-full text-gray-500 text-sm py-2">Cancelar</button>
              </div>
            ) : hasIncompatibleOnly ? (
              <div className="flex flex-col gap-3">
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm">
                  <div className="flex gap-2 items-start">
                    <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-orange-800 mb-1">Paquete no válido para eventos</p>
                      <p className="text-orange-700">
                        Los paquetes de <strong>Una Clase</strong> no aplican para eventos. Necesitas un paquete de varias clases.
                      </p>
                    </div>
                  </div>
                </div>
                <button onClick={() => { onClose(); router.push('/paquetes') }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                  Ver paquetes disponibles
                </button>
                <button onClick={onClose} className="w-full text-gray-500 text-sm py-2">Cancelar</button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" /> Selecciona tu paquete
                </p>

                {compatiblePackages.map(up => (
                  <button key={up.id} onClick={() => setSelectedPackage(up.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${selectedPackage === up.id ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{up.packages.title}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{up.packages.class_type}</p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-blue-600 font-bold text-sm">{up.classes_remaining} clases</p>
                        <p className="text-gray-400 text-xs mt-0.5">Vence {format(new Date(up.expires_at), "d MMM", { locale: es })}</p>
                      </div>
                    </div>
                  </button>
                ))}

                {selectedPackage && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
                    ✓ Se descontará 1 clase de tu paquete · Precio: $0 MXN
                  </div>
                )}

                {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

                <button onClick={handleReserve} disabled={loading || !selectedPackage}
                  className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {loading ? 'Procesando...' : 'Confirmar registro'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}