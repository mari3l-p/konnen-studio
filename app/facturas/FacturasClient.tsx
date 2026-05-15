'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FileText } from 'lucide-react'
import ProfileLayout from '@/app/perfil/ProfileLayout'

type Profile = { full_name: string | null; email: string | null; avatar_url: string | null }
type Booking = {
  id: string
  status: string
  created_at: string
  stripe_payment_intent_id: string | null
  sessions: {
    starts_at: string
    price: number 
    class_types: { name: string }
  } | null
}

type Tab = 'all' | 'paid' | 'unpaid' | 'refunded'

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'paid', label: 'Pagadas' },
  { key: 'unpaid', label: 'No pagadas' },
  { key: 'refunded', label: 'Reembolsadas' },
]

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  confirmed: { label: 'Pagada', color: 'bg-green-100 text-green-600' },
  pending: { label: 'No pagada', color: 'bg-yellow-100 text-yellow-600' },
  cancelled: { label: 'Cancelada', color: 'bg-gray-200 text-gray-500' },
  refunded: { label: 'Reembolsada', color: 'bg-blue-100 text-blue-600' },
}

export default function FacturasClient({
  profile,
  bookings,
}: {
  profile: Profile | null
  bookings: Booking[]
}) {
  const [tab, setTab] = useState<Tab>('all')

  function filterBookings(t: Tab): Booking[] {
    switch (t) {
      case 'paid': return bookings.filter(b => b.status === 'confirmed')
      case 'unpaid': return bookings.filter(b => b.status === 'pending')
      case 'refunded': return bookings.filter(b => b.status === 'refunded')
      default: return bookings
    }
  }

  const shown = filterBookings(tab)

  return (
    <ProfileLayout profile={profile}>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <h2 className="text-2xl font-black text-gray-900 mb-1">Mis facturas</h2>
        <p className="text-gray-400 text-sm mb-6">
          Lleva el control de tus facturas y completa cualquier pago pendiente en pocos clics.
        </p>

        <div className="flex gap-2 flex-wrap mb-6">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors
                ${tab === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">Aún no tienes facturas.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {shown.map(b => {
              const statusInfo = STATUS_MAP[b.status] ?? { label: b.status, color: 'bg-gray-100 text-gray-500' }
              return (
                <div
                  key={b.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">
                      {b.sessions?.class_types?.name ?? 'Clase'}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {format(new Date(b.created_at), "dd MMM yyyy", { locale: es })}
                    </p>
                    {b.stripe_payment_intent_id && (
                      <p className="text-gray-300 text-xs font-mono truncate">
                        {b.stripe_payment_intent_id}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <p className="font-bold text-gray-900 text-sm">
                      {/* Cambio: price directo */}
                      ${b.sessions?.price ?? 0} MXN
                    </p>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </ProfileLayout>
  )
}