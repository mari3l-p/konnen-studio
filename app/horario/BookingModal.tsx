'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Package, AlertCircle, Users, Plus, Minus } from 'lucide-react'
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

function normalize(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

function isCompatible(packageTitle: string, packageClassType: string, sessionClassName: string, sessionDiscipline: string): boolean {
  if (!packageClassType || !sessionDiscipline || !sessionClassName) return false

  const pkgTitle = normalize(packageTitle)
  const pkgType = normalize(packageClassType)
  const clsName = normalize(sessionClassName)
  const clsDiscipline = normalize(sessionDiscipline)

  if (pkgTitle.includes('duo') && !clsName.includes('duo')) return false
  if (clsName.includes('duo')) return pkgTitle.includes('duo')

  if (pkgType.includes('todas las disciplinas') || pkgType.includes('todas')) return true
  if (pkgType === clsDiscipline || pkgType.includes(clsDiscipline) || clsDiscipline.includes(pkgType)) return true

  return false
}

// Paquetes que permiten reservar varios espacios (compartidos entre personas)
function isSharedPackage(packageTitle: string): boolean {
  const title = normalize(packageTitle)
  return title.includes('mixto') || title.includes('elite mix')
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

  // Estado para reservas grupales (paquetes Mixto / Elite Mix)
  const [guestNames, setGuestNames] = useState<string[]>([''])

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

      const dbDiscipline = classType?.discipline ?? classTypeByName?.discipline
      const finalDisciplineToCheck = dbDiscipline || session.class_types.name || ''
      setSessionDiscipline(finalDisciplineToCheck)

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

      const compatible = pkgs.filter(up =>
        isCompatible(up.packages.title, up.packages.class_type, session.class_types.name, finalDisciplineToCheck)
      )
      setCompatiblePackages(compatible)

      if (compatible.length > 0) setSelectedPackage(compatible[0].id)
      setLoadingPackages(false)
    }
    fetchData()
  }, [session.class_types.id, session.class_types.name])

  const selectedPackageData = useMemo(
    () => compatiblePackages.find(p => p.id === selectedPackage) ?? null,
    [compatiblePackages, selectedPackage]
  )

  const isShared = selectedPackageData ? isSharedPackage(selectedPackageData.packages.title) : false

  const spotsLeft = session.session_availability?.spots_left ?? 0
  const maxQuantity = selectedPackageData
    ? Math.min(selectedPackageData.classes_remaining, spotsLeft)
    : 1

  // Al cambiar de paquete, reseteamos el arreglo de nombres
  useEffect(() => {
    setGuestNames([''])
  }, [selectedPackage])

  function updateGuestName(index: number, value: string) {
    setGuestNames(prev => prev.map((n, i) => (i === index ? value : n)))
  }

  function addGuestSlot() {
    if (guestNames.length >= maxQuantity) return
    setGuestNames(prev => [...prev, ''])
  }

  function removeGuestSlot(index: number) {
    if (guestNames.length <= 1) return
    setGuestNames(prev => prev.filter((_, i) => i !== index))
  }

  async function handleReserve() {
    if (!selectedPackage) return

    // Validación en cliente para reservas grupales: todos los nombres llenos
    if (isShared && guestNames.length > 1) {
      const hasEmpty = guestNames.some(n => n.trim().length === 0)
      if (hasEmpty) {
        setError('Completa el nombre de cada reserva antes de confirmar')
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/bookings/with-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          userPackageId: selectedPackage,
          // Solo mandamos nombres si es paquete compartido y hay más de 1 reserva
          guestNames: isShared && guestNames.length > 0 ? guestNames : undefined,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Error al procesar la reserva')
      }

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
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative flex flex-col"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
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
            <span className="font-medium">{spotsLeft || '—'}</span>
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
                  <p className="font-semibold text-orange-800 mb-1">Paquete incompatible</p>
                  <p className="text-orange-700">
                    Tus paquetes activos no incluyen clases de <strong>{session.class_types.name}</strong>.
                  </p>
                </div>
              </div>
            </div>
            <button onClick={() => { onClose(); router.push('/paquetes') }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
              Comprar paquete para esta disciplina
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

            {/* SECCIÓN DE RESERVAS GRUPALES: solo para paquetes Mixto / Elite Mix */}
            {isShared && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex flex-col gap-3">
                <p className="text-sm font-semibold text-purple-800 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Este paquete es compartido — puedes reservar varios espacios
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-purple-700">Número de reservas</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeGuestSlot(guestNames.length - 1)}
                      disabled={guestNames.length <= 1}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-purple-300 text-purple-700 disabled:opacity-30"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-bold text-purple-900 w-5 text-center">{guestNames.length}</span>
                    <button
                      onClick={addGuestSlot}
                      disabled={guestNames.length >= maxQuantity}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-purple-300 text-purple-700 disabled:opacity-30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-purple-600 -mt-1">
                  Máximo {maxQuantity} (según tus créditos y espacios disponibles)
                </p>

                <div className="flex flex-col gap-2">
                  {guestNames.map((name, index) => (
                    <input
                      key={index}
                      type="text"
                      placeholder={index === 0 ? 'Tu nombre' : `Nombre invitado ${index + 1}`}
                      value={name}
                      onChange={(e) => updateGuestName(index, e.target.value)}
                      className="w-full bg-white border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                    />
                  ))}
                </div>
              </div>
            )}

            {selectedPackage && !isShared && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
                ✓ Se descontará 1 clase de tu paquete
              </div>
            )}

            {selectedPackage && isShared && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
                ✓ Se descontarán {guestNames.length} {guestNames.length === 1 ? 'clase' : 'clases'} de tu paquete y se ocuparán {guestNames.length} espacios
              </div>
            )}

            {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

            <button onClick={handleReserve} disabled={loading || !selectedPackage}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {loading ? 'Procesando...' : 'Confirmar reserva'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}