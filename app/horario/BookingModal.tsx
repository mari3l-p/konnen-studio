'use client'

import { useState, useEffect } from 'react'
import { X, Package, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Session } from '@/types'
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
  session: Session
  onClose: () => void
}

// Validación dinámica sincronizada con el backend
function isCompatible(packageClassType: string, sessionDiscipline: string): boolean {
  if (!packageClassType || !sessionDiscipline) return false

  const pkg = packageClassType.toLowerCase().trim()
  const cls = sessionDiscipline.toLowerCase().trim()

  // Paquete universal
  if (pkg.includes('todas las disciplinas') || pkg.includes('todas')) return true

  // Comparación dinámica: si el nombre es igual o uno contiene al otro
  if (pkg === cls || pkg.includes(cls) || cls.includes(pkg)) return true

  return false
}

export default function BookingModal({ session, onClose }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [allPackages, setAllPackages] = useState<UserPackage[]>([])
  const [compatiblePackages, setCompatiblePackages] = useState<UserPackage[]>([])
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [loadingPackages, setLoadingPackages] = useState(true)
  const [sessionDiscipline, setSessionDiscipline] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoadingPackages(false); return }

      const { data: classType } = await supabase
        .from('class_types')
        .select('discipline')
        .eq('id', session.class_types.id ?? session.class_types.name)
        .single()

      const { data: classTypeByName } = await supabase
        .from('class_types')
        .select('discipline')
        .eq('name', session.class_types.name)
        .single()

      // Si la disciplina es null, usamos el nombre de la clase como respaldo
      const dbDiscipline = classType?.discipline ?? classTypeByName?.discipline
      const finalDisciplineToCheck = dbDiscipline || session.class_types.name || ''
      setSessionDiscipline(finalDisciplineToCheck)

      // Obtenemos los paquetes activos del usuario
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

      // Filtramos SOLAMENTE los paquetes compatibles
      const compatible = pkgs.filter(up =>
        isCompatible(up.packages.class_type, finalDisciplineToCheck)
      )
      setCompatiblePackages(compatible)

      if (compatible.length > 0) setSelectedPackage(compatible[0].id)
      setLoadingPackages(false)
    }
    fetchData()
  }, [session.class_types.id, session.class_types.name])

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

  const hasNoPackages = !loadingPackages && allPackages.length === 0
  const hasIncompatibleOnly = !loadingPackages && allPackages.length > 0 && compatiblePackages.length === 0

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

        {loadingPackages ? (
          <div className="py-4 text-center text-gray-400 text-sm">Cargando paquetes...</div>

        ) : hasNoPackages ? (
          <div className="flex flex-col gap-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
              <p className="font-semibold text-amber-800 mb-1">Necesitas un paquete activo</p>
              <p className="text-amber-700">Para reservar una clase necesitas adquirir un paquete primero.</p>
            </div>
            <button
              onClick={() => { onClose(); router.push('/paquetes') }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
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
                  <p className="font-semibold text-orange-800 mb-1">Paquete incompatible</p>
                  <p className="text-orange-700">
                    Tus paquetes activos no incluyen clases de{' '}
                    <strong>{session.class_types.name}</strong>. Necesitas un paquete para esta disciplina.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 font-medium mb-2">Tus paquetes activos:</p>
              {allPackages.map(up => (
                <div key={up.id} className="flex justify-between text-xs text-gray-600 py-1">
                  <span>{up.packages.title} · {up.packages.class_type}</span>
                  <span className="text-gray-400">{up.classes_remaining} clases</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => { onClose(); router.push('/paquetes') }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              Comprar paquete para esta disciplina
            </button>
            <button onClick={onClose} className="w-full text-gray-500 text-sm py-2">Cancelar</button>
          </div>

        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              Selecciona tu paquete
            </p>

            {compatiblePackages.map(up => (
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

            {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

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