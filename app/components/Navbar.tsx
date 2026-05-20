"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Calendar, Zap, Package, Menu,
  ChevronRight, X, ArrowLeft
} from "lucide-react";
import { supabase } from '@/lib/supabase'

const NAV_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Horario", href: "/horario" },
  { label: "Eventos", href: "/eventos" },
  { label: "Paquetes", href: "/paquetes" },
];

const BOTTOM_NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Horario", href: "/horario", icon: Calendar },
  { label: "Eventos", href: "/eventos", icon: Zap },
  { label: "Paquetes", href: "/paquetes", icon: Package },
];

const MENU_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Inicio", href: "/" },
  { label: "Horario", href: "/horario" },
  { label: "Eventos", href: "/eventos" },
  { label: "Paquetes", href: "/paquetes" },
];

const ACCOUNT_LINKS = [
  { label: "Mi perfil", href: "/perfil" },
  { label: "Mis reservas", href: "/reservas" },
  { label: "Mis membresías", href: "/membresias" },
  { label: "Mis facturas", href: "/facturas" },
];

// ── Mobile Menu (fullscreen) ───────────────────────────────────
function MobileMenu({
  isOpen,
  onClose,
  userData,
}: {
  isOpen: boolean
  onClose: () => void
  userData: { name: string; email: string; initials: string } | null
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-white md:hidden flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200 shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Atrás
        </button>
        <span className="font-semibold text-gray-900">Menú</span>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto py-4 px-4 pb-24">

        {/* Nav links */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3">
          {MENU_LINKS.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors
                ${i < MENU_LINKS.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <span className="text-gray-800 text-sm font-medium">{link.label}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
          ))}
        </div>

        {/* Logged in */}
        {userData && (
          <>
            {/* User info */}
            <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 rounded-2xl mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">{userData.initials}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{userData.name}</p>
                <p className="text-gray-400 text-xs">{userData.email}</p>
              </div>
            </div>

            {/* Account links */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3">
              {ACCOUNT_LINKS.map((link, i) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors
                    ${i < ACCOUNT_LINKS.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <span className="text-gray-800 text-sm">{link.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              ))}
            </div>

            {/* Logout */}
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                window.location.href = '/'
              }}
              className="w-full flex items-center justify-between px-5 py-4 bg-white rounded-2xl border border-gray-100 hover:bg-red-50 transition-colors"
            >
              <span className="text-red-500 text-sm font-medium">Cerrar sesión</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </>
        )}

        {/* Not logged in */}
        {!userData && (
          <Link
            href="/login"
            onClick={onClose}
            className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3.5 rounded-2xl text-sm transition-colors"
          >
            Iniciar sesión
          </Link>
        )}
      </div>
    </div>
  )
}

// ── Desktop Account Drawer ─────────────────────────────────────
function AccountDrawer({
  isOpen,
  onClose,
  userData,
}: {
  isOpen: boolean
  onClose: () => void
  userData: { name: string; email: string; initials: string } | null
}) {
  if (!isOpen || !userData) return null

  return (
    <>
      <div className="hidden md:block fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed z-50 bg-white shadow-2xl flex flex-col inset-0 md:inset-auto md:top-0 md:right-0 md:bottom-0 md:w-96">

        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-900 text-base">Cuenta</span>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center gap-4 px-6 py-5">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">{userData.initials}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{userData.name}</p>
              <p className="text-gray-500 text-xs">{userData.email}</p>
            </div>
          </div>

          <div className="h-px bg-gray-100 mx-4" />

          <nav className="py-2">
            {[...MENU_LINKS, ...ACCOUNT_LINKS].map((link) => (
              <Link
                key={link.label + link.href}
                href={link.href}
                onClick={onClose}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <span className="text-gray-800 text-sm">{link.label}</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            ))}
          </nav>

          <div className="h-2 bg-gray-100" />

          <button
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = '/'
            }}
            className="w-full flex items-center justify-between px-6 py-3.5 hover:bg-gray-100 transition-colors"
          >
            <span className="text-red-600 text-sm font-medium">Cerrar sesión</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </>
  )
}

// ── Main Navbar ────────────────────────────────────────────────
export default function Navbar() {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userData, setUserData] = useState<{ name: string; email: string; initials: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true; // Para evitar que se actualice el estado si el componente se desmonta

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!isMounted) return; // Detener si el componente ya no existe

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        if (!isMounted) return;

        const parts = (profile?.full_name ?? '').split(' ').filter(Boolean).slice(0, 2)
        const initials = parts.map((p: string) => p[0].toUpperCase()).join('') || '??'

        setUserData({
          name: profile?.full_name || 'Usuario',
          email: user.email || '',
          initials,
        })
      } else {
        setUserData(null)
      }
      
      if (isMounted) setLoading(false)
    }

    // 1. Llamada inicial
    fetchUser()

    // 2. Suscripción a cambios futuros (ignorando la inicial para evitar el error de concurrencia)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'INITIAL_SESSION') return;
      fetchUser()
    })

    return () => {
      isMounted = false;
      subscription.unsubscribe()
    }
  }, [])

  return (
    <>
      {/* ── Top bar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-14">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">

          <a href="/" className="font-bold text-base">Können</a>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                    isActive ? 'text-blue-600' : 'text-gray-600 hover:text-black'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="hidden md:block text-sm font-medium text-gray-700 hover:text-black transition-colors"
            >
              Dashboard
            </Link>

            {!loading && (
              userData ? (
                <button onClick={() => setDrawerOpen(true)} className="focus:outline-none">
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center hover:scale-105 transition-transform">
                    <span className="text-white text-xs font-bold">{userData.initials}</span>
                  </div>
                </button>
              ) : (
                <Link
                  href="/login"
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Iniciar sesión
                </Link>
              )
            )}
          </div>
        </div>
      </header>

      {/* Top spacer */}
      <div className="h-14" />

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 h-16">
        <div className="grid grid-cols-5 h-full">
          {BOTTOM_NAV.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={label}
                href={href}
                className={`flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors
                  ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-black'}`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            )
          })}

          {/* Menú button */}
          <button
            onClick={() => setMenuOpen(true)}
            className={`flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors
              ${menuOpen ? 'text-blue-600' : 'text-gray-500 hover:text-black'}`}
          >
            <Menu className="w-5 h-5" />
            <span>Menú</span>
          </button>
        </div>
      </nav>

      {/* Bottom spacer for mobile */}
      <div className="md:hidden h-16" />

      {/* ── Mobile fullscreen menu ── */}
      <MobileMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        userData={userData}
      />

      {/* ── Desktop account drawer ── */}
      <AccountDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userData={userData}
      />
    </>
  )
}