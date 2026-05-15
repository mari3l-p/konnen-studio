'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Session } from '@/types'
import { supabase } from '@/lib/supabase'

type Props = {
  session: Session
  onClose: () => void
}

export default function BookingModal({ session, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleReserve() {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // Si no hay usuario, iniciamos flujo de login
      const { error: signInError } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: { redirectTo: window.location.href }
      })
      if (signInError) setError(signInError.message)
      return
    }

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id }),
      })
      
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      if (data.url) {
        window.location.href = data.url
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-1">
          {session.class_types?.name}
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          {format(new Date(session.starts_at), "EEEE d MMMM · hh:mm aa", { locale: es })}
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Instructor</span>
            <span className="font-medium">{session.instructors?.name ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Ubicación</span>
            <span className="font-medium">{session.location}</span>
          </div>
          <div className="flex justify-between border-t pt-2 mt-1">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="font-bold text-tertiary text-lg">
              ${session.price} MXN
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleReserve}
          disabled={loading}
          className="w-full bg-tertiary text-white font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {loading ? 'Preparando pago...' : 'Confirmar y pagar'}
        </button>
      </div>
    </div>
  )
}