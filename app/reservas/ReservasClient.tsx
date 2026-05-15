'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Globe, Calendar } from 'lucide-react'
import ProfileLayout from '@/app/perfil/ProfileLayout'
import Link from 'next/link'

type Profile = { full_name: string | null; email: string | null; avatar_url: string | null }
type Booking = {
  id: string
  status: string
  created_at: string
  sessions: {
    starts_at: string
    location: string
    class_types: { name: string }
    instructors: { name: string } | null
  } | null
}

type Tab = 'upcoming' | 'attended' | 'cancelled' | 'absent' | 'pending'

const TABS: { key: Tab; label: string }[] = [
  { key: 'upcoming', label: 'Próximo' },
  { key: 'attended', label: 'Asistido' },
  { key: 'cancelled', label: 'Cancelado' },
  { key: 'absent', label: 'Ausente' },
  { key: 'pending', label: 'Pendiente' },
]

export default function ReservasClient({
  profile,
  bookings,
}: {
  profile: Profile | null
  bookings: Booking[]
}) {
  const [tab, setTab] = useState<Tab>('upcoming')
  const now = new Date()

  function filterBookings(t: Tab): Booking[] {
    switch (t) {
      case 'upcoming':
        return bookings.filter(b =>
          b.status === 'confirmed' &&
          b.sessions?.starts_at &&
          new Date(b.sessions.starts_at) > now
        )
      case 'attended':
        return bookings.filter(b =>
          b.status === 'confirmed' &&
          b.sessions?.starts_at &&
          new Date(b.sessions.starts_at) <= now
        )
      case 'cancelled':
        return bookings.filter(b => b.status === 'cancelled')
      case 'pending':
        return bookings.filter(b => b.status === 'pending')
      default:
        return []
    }
  }

  const shown = filterBookings(tab)

  return (
    <ProfileLayout profile={profile}>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <h2 className="text-2xl font-black text-gray-900 mb-1">Mis reservas</h2>
        <p className="text-gray-400 text-sm mb-5">Encuentra aquí tus anteriores y próximas reservas</p>

        {/* Timezone */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <span className="font-medium text-gray-700">Zona horaria:</span>
          <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-xs">
            <Globe className="w-3.5 h-3.5" />
            Mexico - Central Time
          </div>
        </div>

        {/* Tabs */}
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
          <div className="py-10 text-center">
            <p className="text-gray-400 text-sm mb-1">No tienes ninguna reserva próxima.</p>
            <p className="text-gray-400 text-sm mb-5">¿Estás listo para reservar?</p>
            <Link
              href="/horario"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              Reservar ahora
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {shown.map(b => (
              <div
                key={b.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">
                    {b.sessions?.class_types?.name ?? '—'}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {b.sessions?.starts_at
                      ? format(new Date(b.sessions.starts_at), "EEEE d MMM · hh:mm aa", { locale: es })
                      : '—'}
                  </p>
                  {b.sessions?.instructors?.name && (
                    <p className="text-gray-400 text-xs">{b.sessions.instructors.name}</p>
                  )}
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0
                  ${b.status === 'confirmed' ? 'bg-green-100 text-green-600' :
                    b.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                  {b.status === 'confirmed' ? 'Confirmado' :
                   b.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProfileLayout>
  )
}