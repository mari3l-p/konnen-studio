'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { User, BookOpen, CreditCard, FileText, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Profile = {
  full_name: string | null
  email: string | null
  avatar_url: string | null
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).slice(0, 2)
    .map(n => n[0].toUpperCase()).join('')
}

const SIDEBAR_LINKS = [
  { label: 'Mi perfil', href: '/perfil', icon: User },
  { label: 'Mis paquetes', href: '/membresias', icon: CreditCard },
  { label: 'Mis reservas', href: '/reservas', icon: BookOpen },
  { label: 'Mis facturas', href: '/facturas', icon: FileText },
]

export default function ProfileLayout({
  profile,
  children,
}: {
  profile: Profile | null
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const initials = getInitials(profile?.full_name ?? null)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 bg-white border-r border-gray-100 flex-col">
        <div className="px-6 py-8 border-b border-gray-100 text-center">
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-2xl">{initials}</span>
            )}
          </div>
          <p className="font-bold text-gray-900 text-base">{profile?.full_name || 'Usuario'}</p>
          <p className="text-gray-400 text-xs truncate px-2">{profile?.email}</p>
        </div>

        <nav className="flex-1 py-4">
          {SIDEBAR_LINKS.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-6 py-3.5 text-sm transition-all
                  ${isActive
                    ? 'bg-blue-50 text-blue-600 font-bold border-r-4 border-blue-600'
                    : 'text-gray-500 hover:bg-gray-50'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 rounded-xl w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Page content */}
      <main className="flex-1 flex justify-center py-10 px-4">
        <div className="w-full max-w-2xl">
          {children}
        </div>
      </main>
    </div>
  )
}