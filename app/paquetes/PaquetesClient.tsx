'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
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
}

function PackageCard({
  pkg,
  onSelect,
  loading,
}: {
  pkg: Package
  onSelect: (pkg: Package) => void
  loading: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const hasDetails = pkg.note || pkg.class_type || pkg.validity || pkg.classes_count

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 text-base">
            <span className="font-bold">{pkg.title}</span>{' '}
            <span className="text-gray-500">{pkg.class_type}</span>
          </p>
          {hasDetails && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-gray-500 text-xs mt-1 hover:text-gray-700 transition-colors"
            >
              Incluye
              {expanded
                ? <ChevronUp className="w-3.5 h-3.5" />
                : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        <p className="font-semibold text-gray-900 text-base shrink-0">
          ${pkg.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </p>

        <button
          onClick={() => onSelect(pkg)}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0 flex items-center gap-2"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Seleccionar
        </button>
      </div>

      {expanded && hasDetails && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-1.5 text-sm text-gray-500">
          {pkg.classes_count && (
            <p>
              {pkg.classes_count}{' '}
              {pkg.classes_count === 1 ? 'clase incluida' : 'clases incluidas'}
            </p>
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
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSelect(pkg: Package) {
    setError(null)

    // Check if logged in first
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    setLoadingId(pkg.id)

    try {
      const res = await fetch('/api/checkout/paquete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id }),
      })

      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      if (!data.url) {
        throw new Error('No se recibió URL de pago')
      }

      // Redirect to Stripe
      window.location.href = data.url

    } catch (e: any) {
      setError(e.message)
      setLoadingId(null)
    }
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
                loading={loadingId === pkg.id}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}