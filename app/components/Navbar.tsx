"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Calendar, Zap, Package, Menu, ChevronRight, X, ArrowLeft } from "lucide-react";
import Image from "next/image";

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
  { label: "Menú", href: "/menu", icon: Menu },
];

const MENU_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Inicio", href: "/" },
  { label: "Mi perfil", href: "/perfil" },
  { label: "Mis reservas", href: "/reservas" },
  { label: "Mis membresías", href: "/membresias" },
  { label: "Mis facturas", href: "/facturas" },
];

const BOTTOM_DRAWER_LINKS = [
  { label: "Descargar al teléfono", href: "/app" },
  { label: "Guías de ayuda", href: "/ayuda" },
];

// Replace with real user data from your auth
const USER = {
  name: "Mariel Palacio",
  email: "marielabrilp@gmail.com",
  initials: "MP",
  language: "Español",
  timezone: "Mexico - Central Time",
  avatarUrl: null as string | null,
};

function AccountDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop — desktop only */}
      <div
        className="hidden md:block fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed z-50 bg-white shadow-2xl flex flex-col inset-0 md:inset-auto md:top-0 md:right-0 md:bottom-0 md:w-105">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-900 text-base">Cuenta</span>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* User info */}
          <div className="flex items-center gap-4 px-6 py-5">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">{USER.initials}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{USER.name}</p>
              <p className="text-gray-500 text-xs">{USER.email}</p>
            </div>
          </div>

          <div className="h-px bg-gray-100 mx-4" />

          {/* Main nav links */}
          <nav className="py-2">
            {MENU_LINKS.map((link) => (
              <Link
                key={link.label}
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

          {/* Settings rows */}
          <div className="py-2">
            <div className="flex items-center justify-between px-6 py-3.5">
              <span className="text-gray-800 text-sm">Idioma</span>
              <span className="text-blue-600 text-sm">{USER.language}</span>
            </div>
            <div className="h-px bg-gray-100 mx-6" />
            <div className="flex items-center justify-between px-6 py-3.5">
              <span className="text-gray-800 text-sm">Zona horaria</span>
              <span className="text-blue-600 text-sm text-right max-w-45 leading-tight">{USER.timezone}</span>
            </div>
          </div>

          <div className="h-2 bg-gray-100" />

          {/* Bottom links */}
          <div className="py-2">
            {BOTTOM_DRAWER_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={onClose}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <span className="text-gray-800 text-sm">{link.label}</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            ))}
          </div>

          <div className="h-2 bg-gray-100" />

          {/* Sign out */}
          <button className="w-full flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
            <span className="text-gray-800 text-sm">Cerrar sesión</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

        </div>
      </div>
    </>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* ── Top bar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-14">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">

          {/*Name */}
            <span className="font-bold text-base text-tertiary">Können</span>

          {/* Desktop: center nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                    isActive ? "text-(--dark-tertiary)" : "text-gray-600 hover:text-black"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-tertiary rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side: Dashboard + Avatar */}
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="hidden md:block text-sm font-medium text-gray-700 hover:text-black transition-colors"
            >
              Dashboard
            </Link>

            {/* Avatar — opens drawer */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="focus:outline-none"
              aria-label="Abrir cuenta"
            >
              {USER.avatarUrl ? (
                <div className="w-9 h-9 rounded-full overflow-hidden">
                  <Image src={USER.avatarUrl} alt="Avatar" width={36} height={36} className="object-cover" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{USER.initials}</span>
                </div>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-14" />

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 h-16">
        <div className="grid grid-cols-5 h-full">
          {BOTTOM_NAV.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={label}
                href={href}
                className={`flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                  isActive ? "text-blue-600" : "text-gray-500 hover:text-black"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      

      {/* Account Drawer */}
      <AccountDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}