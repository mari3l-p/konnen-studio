'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import ProfileLayout from '@/app/perfil/ProfileLayout'
import Link from 'next/link'

type Profile = { full_name: string | null; email: string | null; avatar_url: string | null }
type Booking = {
  id: string
  status: string
  created_at: string
  sessions: { starts_at: string; class_types: { name: string } } | null
}

export default function MembresiastClient({
  profile,
  bookings,
}: {
  profile: Profile | null
  bookings: Booking[]
}) {
  const [tab, setTab] = useState<'active' | 'expired'>('active')

  const active = bookings.filter(b => b.status === 'confirmed')
  const expired = bookings.filter(b => b.status === 'cancelled' || b.status === 'refunded')
  const shown = tab === 'active' ? active : expired

  return (
    <ProfileLayout profile={profile}>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <h2 className="text-2xl font-black text-gray-900 mb-6">Mis paquetes</h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['active', 'expired'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors
                ${tab === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
            >
              {t === 'active' ? 'Activos' : 'Expirados'}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-gray-400 text-sm mb-4">
              {tab === 'active'
                ? 'No tienes paquetes activos.'
                : 'No tienes paquetes expirados.'}
            </p>
            {tab === 'active' && (
              <Link
                href="/paquetes"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
              >
                Ver paquetes disponibles
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {shown.map(b => (
              <div
                key={b.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100"
              >
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {b.sessions?.class_types?.name ?? 'Clase'}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {b.sessions?.starts_at
                      ? format(new Date(b.sessions.starts_at), "dd MMM yyyy", { locale: es })
                      : '—'}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full
                  ${b.status === 'confirmed'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-200 text-gray-500'
                  }`}>
                  {b.status === 'confirmed' ? 'Confirmado' : 'Expirado'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProfileLayout>
  )
}