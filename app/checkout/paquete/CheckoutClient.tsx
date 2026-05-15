'use client'

import { useState } from 'react'
import { ArrowLeft, Lock, CreditCard } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Package = {
  id: string
  title: string
  validity: string
  class_type: string
  price: number
  note: string | null
}

type Profile = {
  full_name: string | null
  email: string | null
}

export default function CheckoutClient({
  pkg,
  profile,
}: {
  pkg: Package
  profile: Profile | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [showPromo, setShowPromo] = useState(false)

  async function handleCheckout() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout/paquete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id }),
      })
      const { url, error: apiError } = await res.json()
      if (apiError) throw new Error(apiError)
      window.location.href = url
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#f4f7fa] py-8 px-4">
      <div className="max-w-lg mx-auto">

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Checkout
        </button>

        {/* Package summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <div className="border border-gray-100 rounded-xl p-4 mb-4 flex items-start justify-between">
            <div>
              <p className="font-bold text-gray-900">
                {pkg.title} {pkg.class_type}
              </p>
            </div>
            <p className="font-semibold text-gray-900 shrink-0 ml-4">
              ${pkg.price.toLocaleString('es-MX')}
            </p>
          </div>
          <p className="text-gray-500 text-sm">
            Una vez • ${pkg.price.toLocaleString('es-MX')} • Sin facturas a futuro
          </p>
          {pkg.validity && (
            <p className="text-gray-400 text-sm mt-1">
              Créditos expiran después de {pkg.validity}
            </p>
          )}
        </div>

        {/* Account section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <h2 className="font-bold text-gray-900 text-lg mb-4">1. Cuenta</h2>
          <div className="border border-gray-100 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 text-sm">{profile?.full_name ?? 'Usuario'}</p>
              <p className="text-gray-400 text-xs mt-0.5">{profile?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Payment section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <h2 className="font-bold text-gray-900 text-lg mb-4">2. Pagar con</h2>

          <div className="border border-blue-500 rounded-xl p-4 flex items-center gap-3 mb-4 bg-blue-50/30">
            <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
            <span className="text-blue-600 font-semibold text-sm">Tarjeta</span>
          </div>

          <p className="text-gray-400 text-xs text-center">
            Al continuar serás redirigido a Stripe para completar el pago de forma segura.
          </p>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Sub total</span>
            <span>${pkg.price.toLocaleString('es-MX')}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mb-4">
            <span>Descuento</span>
            <span>-</span>
          </div>
          <div className="h-px bg-gray-100 mb-4" />
          <div className="flex justify-between font-bold text-gray-900">
            <span>Pagar hoy</span>
            <span>${pkg.price.toLocaleString('es-MX')}</span>
          </div>

          <div className="h-px bg-gray-100 my-4" />

          {/* Promo code */}
          {showPromo ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Código de promoción"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
              <button className="bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
                Aplicar
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              ¿Tiene un código de promoción?{' '}
              <button
                onClick={() => setShowPromo(true)}
                className="text-blue-600 font-medium hover:underline"
              >
                Agregar aquí
              </button>
            </p>
          )}
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-4 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
        )}

        {/* Pay button */}
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-lg shadow-blue-200 mb-4"
        >
          {loading ? 'Redirigiendo...' : `Pagar $${pkg.price.toLocaleString('es-MX')} MXN`}
        </button>

        {/* Security note */}
        <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
          <Lock className="w-3.5 h-3.5" />
          <span>Sus datos se procesan de forma segura con Stripe usando encriptación de grado bancario.</span>
        </div>

      </div>
    </div>
  )
}