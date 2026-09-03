'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Globe, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import EventBookingModal from './EventBookingModal'

type Props = {
  initialEvents: any[]
  registeredEventIds: string[]
}

export default function EventosClient({ initialEvents, registeredEventIds }: Props) {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set(registeredEventIds))

  function handleSuccess(eventId: string) {
    setRegisteredIds(prev => new Set(prev).add(eventId))
  }

  return (
    <section className="w-full bg-[#f4f7fa] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">

        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Eventos</h1>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <span className="font-medium">Zona horaria:</span>
          <div className="flex items-center gap-1.5 border border-gray-200 bg-white rounded-lg px-3 py-1.5 text-xs md:text-sm">
            <Globe className="w-3.5 h-3.5 text-gray-500" />
            <span>Mexico - Central Time</span>
          </div>
        </div>

        {initialEvents.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 text-tertiary rounded-2xl px-6 py-5 text-sm">
            Por el momento no hay eventos programados. Vuelve a consultar pronto.
          </div>
        )}

        {initialEvents.length > 0 && (
          <div className="flex flex-col gap-4">
            {initialEvents.map(event => {
              const ahora = new Date()
              const limite = event.fecha_limite_especial ? new Date(event.fecha_limite_especial) : null
              const esPrecioEspecial = event.precio_especial && limite && ahora < limite
              const precioActual = esPrecioEspecial ? event.precio_especial : event.price
              const yaRegistrado = registeredIds.has(event.id)

              return (
                <div
                  key={event.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row"
                >
                  {event.image_url && (
                    <div className="relative w-full h-48 sm:h-56 md:w-48 md:h-auto shrink-0 bg-gray-100">
                      <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 192px"
                      />
                    </div>
                  )}

                  <div className="flex-1 p-4 md:p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 sm:gap-3 mb-1">
                        <p className="font-bold text-gray-900 text-base sm:text-lg leading-snug">{event.title}</p>
                      </div>

                      <p className="text-tertiary text-xs sm:text-sm font-medium mb-1 capitalize">
                        {format(new Date(event.starts_at), "EEEE d MMMM yyyy · hh:mm aa", { locale: es })}
                        {event.ends_at && ` — ${format(new Date(event.ends_at), "hh:mm aa", { locale: es })}`}
                      </p>
                      <p className="text-gray-400 text-xs sm:text-sm mb-3">{event.location}</p>
                      {event.description && (
                        <p className="text-gray-600 text-sm leading-relaxed">{event.description}</p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-xl">
                          {Number(precioActual) === 0 ? 'Gratis' : `$${precioActual} MXN`}
                        </span>
                        {esPrecioEspecial && limite && (
                          <span className="text-xs text-emerald-600 font-medium">
                            Precio especial antes del {format(limite, "d 'de' MMMM", { locale: es })}
                          </span>
                        )}
                        {!esPrecioEspecial && Boolean(event.precio_especial) && event.precio_especial > 0 && (
                          <span className="text-xs text-gray-400 line-through">
                            Precio especial finalizado
                          </span>
                        )}
                        <span className="text-xs text-blue-600 font-medium mt-0.5">
                          $0 usando créditos de tu paquete
                        </span>
                      </div>

                      {yaRegistrado ? (
                        <span className="flex items-center justify-center gap-1.5 text-emerald-600 border-2 border-emerald-200 bg-emerald-50 text-sm font-semibold px-5 py-2.5 rounded-xl whitespace-nowrap w-full sm:w-auto">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          Ya estás registrado
                        </span>
                      ) : (
                        <button
                          onClick={() => setSelectedEvent(event)}
                          className="hover:text-white hover:bg-tertiary text-tertiary border-2 border-tertiary text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 w-full sm:w-auto"
                        >
                          Registrarse
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventBookingModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onSuccess={handleSuccess}
        />
      )}
    </section>
  )
}