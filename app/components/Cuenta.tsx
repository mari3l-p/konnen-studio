"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, X, ArrowLeft } from "lucide-react";

// Replace with real user data from your auth
const USER = {
  name: "Mariel Palacio",
  email: "marielabrilp@gmail.com",
  initials: "MP",
  language: "Español",
  timezone: "Mexico - Central Time",
};

const MENU_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Inicio", href: "/" },
  { label: "Mi perfil", href: "/perfil" },
  { label: "Mis reservas", href: "/reservas" },
  { label: "Mis membresías", href: "/membresias" },
  { label: "Mis facturas", href: "/facturas" },
];

const BOTTOM_LINKS = [
  { label: "Descargar al teléfono", href: "/app" },
  { label: "Guías de ayuda", href: "/ayuda" },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AccountDrawer({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop — desktop only */}
      <div
        className="hidden md:block fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`
          fixed z-50 bg-white shadow-2xl flex flex-col
          /* Mobile: fullscreen */
          inset-0
          /* Desktop: right-side drawer */
          md:inset-auto md:top-0 md:right-0 md:bottom-0 md:w-105
        `}
      >
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

          <div className="h-2 bg-gray-100 mx-0" />

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
            {BOTTOM_LINKS.map((link) => (
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