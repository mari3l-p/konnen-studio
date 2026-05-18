'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import ProfileLayout from '@/app/perfil/ProfileLayout'
import Link from 'next/link'

type Profile = { full_name: string | null; email: string | null; avatar_url: string | null }
type UserPackage = {
  id: string
  status: string
  classes_remaining: number
  expires_at: string
  created_at: string
  packages: { title: string; class_type: string; classes_count: number } | null
}

export default function MembresiastClient({
  profile,
  userPackages,
}: {
  profile: Profile | null
  userPackages: UserPackage[]
}) {
  const [tab, setTab] = useState<'active' | 'expired'>('active')

  const active = userPackages.filter(p => p.status === 'active')
  const expired = userPackages.filter(p => p.status !== 'active')
  const shown = tab === 'active' ? active : expired

  return (
    <ProfileLayout profile={profile}>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <h2 className="text-2xl font-black text-gray-900 mb-6">Mis paquetes</h2>

        <div className="flex gap-2 mb-6">
          {(['active', 'expired'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors
                ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              {t === 'active' ? 'Activos' : 'Expirados'}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-gray-400 text-sm mb-4">
              {tab === 'active' ? 'No tienes paquetes activos.' : 'No tienes paquetes expirados.'}
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
          <div className="flex flex-col gap-4">
            {shown.map(up => {
              const total = up.packages?.classes_count ?? 1
              const used = total - up.classes_remaining
              const pct = Math.round((up.classes_remaining / total) * 100)

              return (
                <div key={up.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-900">{up.packages?.title ?? 'Paquete'}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{up.packages?.class_type}</p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full
                      ${up.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                      {up.status === 'active' ? 'Activo' : 'Expirado'}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{up.classes_remaining} clases restantes</span>
                      <span>{used} usadas de {total}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-gray-400 text-xs">
                    Vence el {format(new Date(up.expires_at), "d 'de' MMMM yyyy", { locale: es })}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </ProfileLayout>
  )
}