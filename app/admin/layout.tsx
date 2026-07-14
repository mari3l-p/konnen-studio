'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  Users,
  BookOpen,
  BarChart3,
  Dumbbell,
  LogOut,
  Menu,
  ExternalLink,
  ShoppingBag,
  Cake,
  BicepsFlexed,
  SquareUserRound
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const NAV = [
  { label: 'Resumen', href: '/admin', icon: LayoutDashboard },
  { label: 'Horarios', href: '/admin/horarios', icon: Calendar },
  { label: 'Tipos de clase', href: '/admin/clases', icon: Dumbbell },
  { label: 'Disciplina', href: '/admin/disciplina', icon: BicepsFlexed },
  { label: 'Instructores', href: '/admin/instructores', icon: Users },
  { label: 'Reservas', href: '/admin/reservas', icon: BookOpen },
  { label: 'Paquetes', href: '/admin/paquetes', icon: ShoppingBag },
  { label: 'Clientes', href: '/admin/clientes', icon: Users },
  { label: 'Clientes Info', href: '/admin/clientesInfo', icon: SquareUserRound },
  { label: 'Eventos', href: '/admin/eventos', icon: Ticket },
  { label: 'Birthday', href: '/admin/birthday', icon: Cake },
  { label: 'Reportes', href: '/admin/reportes', icon: BarChart3 },
]

function Sidebar({
  pathname,
  onClose,
  onLogout,
}: {
  pathname: string
  onClose: () => void
  onLogout: () => void
}) {
  return (
    <div className="flex flex-col h-full">

      {/* Logo — clicking goes to home */}
      <a
        href="/"
        className="px-6 py-6 border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          
          <div>
            <p className="text-white font-bold text-sm leading-tight">Konnen Studio</p>
            <p className="text-gray-500 text-xs">Panel Admin</p>
          </div>
        </div>
      </a>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-gray-800 flex flex-col gap-1">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>

        <a href="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
          <ExternalLink className="w-4 h-4" />
          Volver a inicio
        </a>
      </div>

    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isAuthPage =
    pathname === '/admin/login' ||
    pathname === '/admin/set-password'

  if (isAuthPage) {
    return <>{children}</>
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 bg-gray-900 border-r border-gray-800 flex-col">
        <Sidebar
          pathname={pathname}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-60 bg-gray-900 border-r border-gray-800 flex flex-col md:hidden">
            <Sidebar
              pathname={pathname}
              onClose={() => setSidebarOpen(false)}
              onLogout={handleLogout}
            />
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-4 px-4 py-3 bg-gray-900 border-b border-gray-800">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-gray-400" />
          </button>
          <span className="font-bold text-sm">Admin · Konnen Studio</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>

      </div>
    </div>
  )
}