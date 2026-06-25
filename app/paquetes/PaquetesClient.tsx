'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Package = {
  id: string
  title: string
  validity: string
  class_type: string
  classes_count: number | null
  price: number
  note: string | null
  is_first_class: boolean
}

function PackageCard({
  pkg,
  onSelect,
  alreadyPurchasedFirstClass,
}: {
  pkg: Package
  onSelect: (pkg: Package) => void
  alreadyPurchasedFirstClass: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const hasDetails = pkg.note || pkg.class_type || pkg.validity || pkg.classes_count
  const isBlocked = pkg.is_first_class && alreadyPurchasedFirstClass

  return (
    <div className={`bg-white rounded-2xl shadow-sm border px-6 py-5 transition-opacity
      ${isBlocked ? 'border-gray-200 opacity-60' : 'border-gray-100'}`}>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        {/* Left: title + details toggle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-gray-900 text-base leading-tight">
              <span className="font-bold">{pkg.title}</span>{' '}
              <span className="text-gray-500">{pkg.class_type}</span>
            </p>
            {pkg.is_first_class && (
              <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                Solo 1 vez
              </span>
            )}
          </div>

          {isBlocked && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Ya utilizaste este paquete
            </p>
          )}

          {hasDetails && !isBlocked && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-gray-500 text-xs mt-2 hover:text-gray-700 transition-colors"
            >
              Incluye
              {expanded
                ? <ChevronUp className="w-3.5 h-3.5" />
                : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Right: price + button */}
        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-gray-100 sm:border-0">
          <p className="font-semibold text-gray-900 text-lg sm:text-base shrink-0">
            ${pkg.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>

          {isBlocked ? (
            <button
              disabled
              className="border border-gray-200 text-gray-400 bg-gray-50 font-semibold px-5 py-2.5 rounded-xl text-sm cursor-not-allowed flex items-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              No disponible
            </button>
          ) : (
            <button
              onClick={() => onSelect(pkg)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0 flex items-center gap-2"
            >
              Comprar
            </button>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && hasDetails && !isBlocked && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-1.5 text-sm text-gray-500">
          {pkg.classes_count && (
            <p>{pkg.classes_count} {pkg.classes_count === 1 ? 'clase incluida' : 'clases incluidas'}</p>
          )}
          {pkg.validity && <p>Vigencia de {pkg.validity}</p>}
          {pkg.note && <p>{pkg.note}</p>}
        </div>
      )}
    </div>
  )
}

export default function PaquetesClient({ packages }: { packages: Package[] }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [alreadyPurchasedFirstClass, setAlreadyPurchasedFirstClass] = useState(false)
  const [checkingHistory, setCheckingHistory] = useState(true)

  // Estados para el Modal
  const [modalAbierto, setModalAbierto] = useState(false)
  const [paqueteSeleccionado, setPaqueteSeleccionado] = useState<Package | null>(null)

  useEffect(() => {
    async function checkFirstClassHistory() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setCheckingHistory(false); return }

      const { data } = await supabase
        .from('user_packages')
        .select('id, packages(is_first_class)')
        .eq('user_id', user.id)

      const hasUsed = (data ?? []).some((up: any) => up.packages?.is_first_class === true)
      setAlreadyPurchasedFirstClass(hasUsed)
      setCheckingHistory(false)
    }
    checkFirstClassHistory()
  }, [])

  async function handleSelect(pkg: Package) {
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // En lugar de llamar a Stripe, abrimos el modal
    setPaqueteSeleccionado(pkg)
    setModalAbierto(true)
  }

  return (
    <section className="w-full bg-[#f4f7fa] min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Paquetes</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-5 py-4 text-sm mb-4">
            {error}
          </div>
        )}

        {packages.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-2xl px-6 py-5 text-sm">
            Aún no hay paquetes disponibles.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {packages.map(pkg => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onSelect={handleSelect}
                alreadyPurchasedFirstClass={alreadyPurchasedFirstClass}
              />
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE TRANSFERENCIA */}
      {modalAbierto && paqueteSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
            
            <button 
              onClick={() => setModalAbierto(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>

            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 text-center">
              ¡Tu reserva casi queda hecha!
            </h3>
            
            <p className="text-gray-600 mb-6 text-center text-sm">
              Estás comprando: <strong>{paqueteSeleccionado.title}</strong> por ${paqueteSeleccionado.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}.
              <br/><br/>
              Haz el pago a este número de cuenta para finalizar:
            </p>

            <div className="bg-gray-50 rounded-xl p-5 mb-6 text-gray-700 text-sm space-y-3 border border-gray-200">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="font-semibold text-gray-500">Banco:</span>
                <span className="font-medium">SANTANDER</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="font-semibold text-gray-500">Titular:</span>
                <span className="font-medium">Consuelo Aguilar</span>
              </div>
              <div className="flex flex-col pt-1">
                <span className="font-semibold text-gray-500 mb-1">No. De Tarjeta:</span>
                <span className="font-mono text-base font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">5579 0990 1864 0724</span>
              </div>
              <div className="flex flex-col pt-1">
                <span className="font-semibold text-gray-500 mb-1">Cuenta Clabe:</span>
                <span className="font-mono text-base font-medium text-green-600 bg-blue-50 px-2 py-1 rounded w-fit">014130200125155444</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-amber-800 text-sm text-center">
                Manda tu comprobante por WhatsApp y <strong>anota tu nombre y apellido</strong> en el concepto o referencia a la hora de hacer la transferencia.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <a 
                href={`https://wa.me/529671486784?text=Hola,%20acabo%20de%20hacer%20el%20pago%20por%20el%20paquete%20${encodeURIComponent(paqueteSeleccionado.title)}`}
                target="_blank"
                rel="noreferrer"
                style={{ backgroundColor: '#25D366' }}
                className="w-full font-semibold py-3.5 text-white rounded-xl text-center shadow-sm flex justify-center items-center gap-2"
>
                Enviar comprobante a WhatsApp
              </a>
              <button 
                onClick={() => setModalAbierto(false)}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3.5 rounded-xl text-center transition-colors border border-gray-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}