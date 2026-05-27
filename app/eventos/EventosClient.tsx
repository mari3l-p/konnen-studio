'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Globe } from 'lucide-react'
import Image from 'next/image'

export default function EventosClient({ initialEvents }: { initialEvents: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleRegistro = async (event: any) => {
    setLoadingId(event.id)
    try {
      console.log("1. Enviando petición a la API para el evento:", event.id)
      
      const response = await fetch("/api/checkout/evento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          nombreCliente: "Usuario Konnen", 
        }),
      })

      console.log("2. Status de la respuesta:", response.status)
      
      // Si la API no existe (Error 404)
      if (!response.ok && response.status === 404) {
        console.error("❌ ERROR: No se encontró la ruta de la API. ¿Creaste el archivo app/api/checkout/evento/route.ts?")
        alert("Falta crear el archivo de la API. Revisa la consola.")
        setLoadingId(null)
        return
      }

      const data = await response.json()
      console.log("3. Datos recibidos de la API:", data)
      
      if (data.url) {
        console.log("✅ Éxito! Redirigiendo a Stripe...")
        window.location.href = data.url
      } else {
        console.error("❌ La API devolvió un error:", data.error)
        alert(`Error: ${data.error || "Problema desconocido en la API"}`)
      }
    } catch (error) {
      console.error("❌ Error catastrófico en el fetch:", error)
      alert("Error de conexión. ¿Iniciaste el servidor?")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <section className="w-full bg-[#f4f7fa] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">

        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Eventos</h1>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <span className="font-medium hidden sm:inline">Zona horaria:</span>
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
              // 1. Evaluamos de forma segura la fecha y los precios
              const ahora = new Date()
              const limite = event.fecha_limite_especial ? new Date(event.fecha_limite_especial) : null
              
              // Verifica que exista precio_especial, límite, y que hoy sea menor a la fecha límite
              const esPrecioEspecial = event.precio_especial && limite && ahora < limite
              
              // Usamos event.price en lugar de precio_regular
              const precioActual = esPrecioEspecial ? event.precio_especial : event.price

              return (
                <div
                  key={event.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row"
                >
                  {event.image_url && (
                    <div className="relative w-full md:w-48 h-48 md:h-auto shrink-0 bg-gray-100">
                      <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 192px"
                      />
                    </div>
                  )}

                  <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-gray-900 text-lg mb-1">{event.title}</p>
                        {event.creditos_otorgados > 0 && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
                            +{event.creditos_otorgados} Créditos
                          </span>
                        )}
                      </div>
                      
                      <p className="text-tertiary text-sm font-medium mb-1 capitalize">
                        {format(new Date(event.starts_at), " d MMMM yyyy · hh:mm aa", { locale: es })}
                        {event.ends_at && ` — ${format(new Date(event.ends_at), " d MMMM yyyy · hh:mm aa", { locale: es })}`}
                      </p>
                      <p className="text-gray-400 text-sm mb-3">{event.location}</p>
                      {event.description && (
                        <p className="text-gray-600 text-sm leading-relaxed">{event.description}</p>
                      )}
                    </div>

                    <div className="flex items-end justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-xl">
                          {Number(precioActual) === 0 ? 'Gratis' : `$${precioActual} MXN`}
                        </span>
                        {esPrecioEspecial && limite && (
                          <span className="text-xs text-emerald-600 font-medium">
                            Precio especial antes del {format(limite, "d 'de' MMMM", { locale: es })}
                          </span>
                        )}
                        {!esPrecioEspecial && event.precio_especial > 0 && (
                          <span className="text-xs text-gray-400 line-through">
                            Precio especial finalizado
                          </span>
                        )}
                      </div>

                      <button 
                        onClick={() => handleRegistro(event)}
                        disabled={loadingId === event.id}
                        className="hover:text-white hover:bg-tertiary text-tertiary border-2 border-tertiary text-sm font-semibold px-5 py-2 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingId === event.id ? 'Cargando...' : 'Registrarse'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}