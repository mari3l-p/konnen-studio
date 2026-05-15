'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Package = {
  id: string
  title: string
  validity: string
  class_type: string
  price: number
  note: string | null
}

function PackageCard({ pkg, onSelect }: { pkg: Package; onSelect: (pkg: Package) => void }) {
  const [expanded, setExpanded] = useState(false)
  const hasDetails = pkg.note || pkg.class_type || pkg.validity

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 text-base">
            <span className="font-bold">{pkg.title}</span> {pkg.class_type}
          </p>
          {hasDetails && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-gray-500 text-xs mt-1 hover:text-gray-700 transition-colors"
            >
              Incluye
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
        <p className="font-semibold text-gray-900 text-base shrink-0">
          ${pkg.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </p>
        <button
          onClick={() => onSelect(pkg)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
        >
          Seleccionar
        </button>
      </div>

      {expanded && hasDetails && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-1.5 text-sm text-gray-600">
          {pkg.validity && <p className="text-gray-500">Vigencia de {pkg.validity}</p>}
          {pkg.note && <p className="text-gray-500">{pkg.note}</p>}
        </div>
      )}
    </div>
  )
}

export default function PaquetesClient({ packages }: { packages: Package[] }) {
  const router = useRouter()

  async function handleSelect(pkg: Package) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    router.push(`/checkout/paquete?id=${pkg.id}`)
  }

  return (
    <section className="w-full bg-[#f4f7fa] min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Paquetes</h1>

        {packages.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-2xl px-6 py-5 text-sm">
            Aún no hay paquetes disponibles.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {packages.map(pkg => (
              <PackageCard key={pkg.id} pkg={pkg} onSelect={handleSelect} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}