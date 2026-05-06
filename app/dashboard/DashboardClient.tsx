'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, Zap, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Profile = {
  id: string
  full_name: string | null
  email: string | null
}

type Booking = {
  id: string
  sessions: {
    starts_at: string
    location: string
    class_types: { name: string }
    instructors: { name: string } | null
  } | null
}

type Props = {
  profile: Profile | null
  bookings: Booking[]
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('')
}

const QUICK_LINKS = [
  { label: 'Horario', href: '/horario', icon: Calendar },
  { label: 'Eventos', href: '/eventos', icon: Zap },
  { label: 'Paquetes', href: '/paquetes', icon: Package },
]

export default function DashboardClient({ profile, bookings }: Props) {
  const router = useRouter()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Cliente'
  const initials = getInitials(profile?.full_name)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <section className="w-full bg-[#f4f7fa] min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">

        {/* Greeting */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            Hola, {firstName} 👋
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold">{initials}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-gray-700 transition-colors hidden md:block"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Upcoming bookings */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-bold text-gray-900">Próximos</h2>
            <span className="bg-gray-800 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {bookings.length}
            </span>
          </div>

          {bookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
              <p className="text-gray-500 text-sm">No tienes ninguna reserva próxima.</p>
              <p className="text-gray-400 text-sm">Explora nuestros servicios a continuación.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {bookings.map(b => b.sessions && (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-bold text-gray-900">{b.sessions.class_types.name}</p>
                    <p className="text-gray-500 text-sm mt-0.5">
                      {format(new Date(b.sessions.starts_at), "EEEE d MMMM · hh:mm aa", { locale: es })}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">{b.sessions.location}</p>
                  </div>
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">¿Qué te gustaría hacer hoy?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {QUICK_LINKS.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 hover:shadow-md hover:border-blue-100 transition-all flex items-center justify-between group"
              >
                <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {label}
                </span>
                <Icon className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Logout mobile */}
        <button
          onClick={handleLogout}
          className="md:hidden text-sm text-gray-400 hover:text-gray-700 text-center transition-colors"
        >
          Cerrar sesión
        </button>

      </div>
    </section>
  )
}