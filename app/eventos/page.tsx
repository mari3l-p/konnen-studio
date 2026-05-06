import { createSupabaseServerClient } from '@/lib/supabase-server'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Globe, SlidersHorizontal } from 'lucide-react'
import Image from 'next/image'

export default async function EventosPage() {
  const supabase = await createSupabaseServerClient()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('is_cancelled', false)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })

  return (
    <section className="w-full bg-[#f4f7fa] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">

        {/* Title row */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Eventos</h1>
        </div>

        {/* Timezone */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <span className="font-medium hidden sm:inline">Zona horaria:</span>
          <div className="flex items-center gap-1.5 border border-gray-200 bg-white rounded-lg px-3 py-1.5 text-xs md:text-sm">
            <Globe className="w-3.5 h-3.5 text-gray-500" />
            <span>Mexico - Central Time</span>
          </div>
        </div>

        {/* No events */}
        {(!events || events.length === 0) && (
          <div className="bg-gray-50 border border-gray-200 text-tertiary rounded-2xl px-6 py-5 text-sm">
            Por el momento no hay eventos programados. Vuelve a consultar pronto.
          </div>
        )}

        {/* Events grid */}
        {events && events.length > 0 && (
          <div className="flex flex-col gap-4">
            {events.map(event => (
              <div
                key={event.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row"
              >
                {/* Image */}
                {event.image_url && (
                  <div className="relative w-full md:w-48 h-48 md:h-auto shrink-0 bg-gray-100">
                    <Image
                      src={event.image_url}
                      alt={event.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
                  <div>
                    <p className="font-bold text-gray-900 text-lg mb-1">{event.title}</p>
                    <p className="text-tertiary text-sm font-medium mb-1 capitalize">
                      {format(new Date(event.starts_at), "EEEE d MMMM yyyy · hh:mm aa", { locale: es })}
                      {event.ends_at && ` — ${format(new Date(event.ends_at), "hh:mm aa", { locale: es })}`}
                    </p>
                    <p className="text-gray-400 text-sm mb-3">{event.location}</p>
                    {event.description && (
                      <p className="text-gray-600 text-sm leading-relaxed">{event.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <span className="font-bold text-gray-900">
                      {event.price_cents === 0 ? 'Gratis' : `$${event.price_cents} MXN`}
                    </span>
                    <button className="bg-tertiary hover:bg-tertiary text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
                      Registrarse
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}