'use client'

import { useState, useEffect } from 'react'
import { format, addDays, isSameDay, startOfWeek, addWeeks, subWeeks } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, SlidersHorizontal, Globe } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Session } from '@/types'
import BookingModal from './BookingModal'

type Props = {
  sessions: Session[]
  bookedSessionIds?: string[]
  isLoggedIn?: boolean
}

const DAYS = Array.from({ length: 7 }, (_, i) => i)

// Función unificada que nos da el número exacto de horas que faltan para la clase.
function getHoursUntilClass(startsAt: string): number {
  const msUntilClass = new Date(startsAt).getTime() - Date.now()
  return msUntilClass / (1000 * 60 * 60)
}

export default function ScheduleClient({
  sessions = [],
  bookedSessionIds = [],
  isLoggedIn = false,
}: Props) {
  const router = useRouter()
  
  const [isMounted, setIsMounted] = useState(false)
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  
  const [isLoadingAction, setIsLoadingAction] = useState(false)

  const bookedSet = new Set(bookedSessionIds)

  const daySessions = sessions.filter((s) =>
    isSameDay(new Date(s.starts_at), selectedDay)
  )

  const monthLabel = format(weekStart, 'MMMM yyyy', { locale: es })
    .replace(/^\w/, (c) => c.toUpperCase())

  useEffect(() => {
    setIsMounted(true)
  }, [])

  function handleReserveClick(session: Session) {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    setSelectedSession(session)
  }

  async function handleCancelReservation(sessionId: string) {
    const confirmacion = window.confirm('¿Estás seguro de que deseas cancelar esta reserva? Tu crédito será devuelto a tu paquete.')
    if (!confirmacion) return

    setIsLoadingAction(true)
    try {
      const res = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
      
      const contentType = res.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
         throw new Error("El servidor devolvió una respuesta no válida. Revisa la consola para más detalles.")
      }

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Hubo un error al cancelar la clase.')
      }
      
      alert('Reserva cancelada con éxito. El crédito ha sido devuelto a tu paquete.')
      router.refresh() 
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsLoadingAction(false)
    }
  }

  if (!isMounted) {
    return null; 
  }

  return (
    <section className="w-full bg-[#f4f7fa] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">

        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Horario</h1>
          <button className="flex items-center gap-2 border border-gray-300 bg-white rounded-xl px-3 md:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 md:mb-6">
          <span className="font-medium hidden sm:inline">Zona horaria:</span>
          <button className="flex items-center gap-1.5 border border-gray-200 bg-white rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors text-xs md:text-sm">
            <Globe className="w-3.5 h-3.5 text-gray-500" />
            <span>Mexico - Central Time</span>
            <ChevronRight className="w-3 h-3 text-gray-400 rotate-90" />
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-3 md:mb-4">
          <div className="flex items-center justify-between px-3 md:px-4 py-2.5 md:py-3 border-b border-gray-100">
            <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900">
              {monthLabel}
              <ChevronRight className="w-4 h-4 rotate-90 text-gray-400" />
            </button>
            <div className="flex items-center gap-1.5 md:gap-2">
              <button onClick={() => setWeekStart((w) => subWeeks(w, 1))} className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <button onClick={() => { const today = new Date(); setWeekStart(startOfWeek(today, { weekStartsOn: 1 })); setSelectedDay(today); }} className="px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Hoy
              </button>
              <button onClick={() => setWeekStart((w) => addWeeks(w, 1))} className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7">
            {DAYS.map((offset) => {
              const day = addDays(weekStart, offset)
              const isSelected = isSameDay(day, selectedDay)
              const isToday = isSameDay(day, new Date())
              return (
                <button
                  key={offset}
                  onClick={() => setSelectedDay(day)}
                  className={`flex flex-col items-center py-3 md:py-4 transition-colors border-r last:border-r-0 border-gray-100
                    ${isSelected ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <span className="text-[10px] md:text-xs font-medium mb-1 capitalize">
                    {format(day, 'EEE', { locale: es }).replace('.', '')}
                  </span>
                  <span className={`text-base md:text-lg font-bold leading-none ${isSelected ? 'text-white' : isToday ? 'text-blue-600' : ''}`}>
                    {format(day, 'd')}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-gray-200 rounded-xl px-3 md:px-4 py-2 mb-3 md:mb-4 text-xs md:text-sm text-gray-600 font-medium capitalize">
          {format(selectedDay, "EEEE d MMMM yyyy", { locale: es })}
        </div>

        <div className="flex flex-col gap-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {daySessions.length === 0 ? (
            <div className="py-12 md:py-16 text-center text-gray-400 text-sm">
              No hay clases programadas para este día.
            </div>
          ) : (
            daySessions.map((session, i) => {
              const spotsLeft = session.session_availability?.spots_left ?? 0
              const isFull = spotsLeft <= 0
              const isLow = spotsLeft > 0 && spotsLeft <= 3
              const isBooked = bookedSet.has(session.id)
              
              // Tiempos
              const hoursUntil = getHoursUntilClass(session.starts_at)
              const isPast = hoursUntil <= 0
              const canBook = hoursUntil >= 2   
              const canCancel = hoursUntil >= 8 

              // Imagen directa desde la base de datos
              const displayImage = session.class_types.image_url;

              return (
                <div
                  key={session.id}
                  className={`flex items-center gap-3 md:gap-6 px-4 md:px-6 py-4 md:py-5 ${
                    i < daySessions.length - 1 ? 'border-b border-gray-100' : ''
                  } ${isPast && !isBooked ? 'opacity-60' : ''}`}
                >
                  <div className="w-16 md:w-20 shrink-0">
                    <p className="font-bold text-gray-900 text-sm md:text-base">
                      {format(new Date(session.starts_at), 'hh:mm aa')}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {session.class_types.duration_mins} mins
                    </p>
                  </div>

                  {/* Contenedor cuadrado ajustado w-24 h-24 y object-top */}
                  <div className="hidden md:block w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                    {displayImage ? (
                      <Image
                        src={displayImage}
                        alt={session.class_types.name}
                        width={96}
                        height={96}
                        className="object-cover object-top w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm md:text-base mb-0.5 truncate">
                      {session.class_types.name}
                    </p>
                    <p className="text-gray-600 text-xs md:text-sm truncate">
                      {session.instructors?.name}
                    </p>
                    <p className="text-gray-400 text-xs truncate">{session.location}</p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 md:gap-2 shrink-0">
                    {isBooked ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-green-600 text-xs font-semibold">✓ Reservada</span>
                        {canCancel ? (
                          <button
                            onClick={() => handleCancelReservation(session.id)}
                            disabled={isLoadingAction}
                            className="border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 px-3 md:px-5 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-colors"
                          >
                            Cancelar clase
                          </button>
                        ) : (
                          <>
                            <button
                              disabled
                              className="border border-gray-200 text-gray-400 bg-gray-50 px-3 md:px-5 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-medium cursor-default"
                            >
                              Ya reservada
                            </button>
                            <span className="text-gray-400 text-[10px]">Fuera de tiempo para cancelar</span>
                          </>
                        )}
                      </div>
                    ) : isPast ? (
                      <button disabled className="border border-gray-200 text-gray-400 bg-gray-50 px-3 md:px-5 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-medium cursor-default">
                        Clase finalizada
                      </button>
                    ) : !canBook ? (
                      <div className="flex flex-col items-end gap-1">
                         <span className="text-orange-500 text-xs font-semibold">Cerrada</span>
                         <button disabled className="border border-gray-200 text-gray-400 bg-gray-50 px-3 md:px-5 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-medium cursor-default">
                           Reservas cerradas
                         </button>
                      </div>
                    ) : isFull ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-red-500 text-xs font-semibold">Sin espacios</span>
                        <button disabled className="border border-red-200 text-red-400 bg-red-50 px-3 md:px-5 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-medium cursor-default">
                          Clase llena
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        {isLow && (
                          <span className="text-orange-500 text-xs font-semibold">
                            {spotsLeft} {spotsLeft === 1 ? 'espacio' : 'espacios'}
                          </span>
                        )}
                        <button
                          onClick={() => handleReserveClick(session)}
                          className="border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors px-3 md:px-6 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-medium whitespace-nowrap"
                        >
                          {isLoggedIn ? 'Reservar' : 'Iniciar sesión'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {selectedSession && (
        <BookingModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </section>
  )
}