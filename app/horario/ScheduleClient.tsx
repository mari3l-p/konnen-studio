'use client'

import { useState } from 'react'
import { format, addDays, isSameDay, startOfWeek, addWeeks, subWeeks } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, SlidersHorizontal, Globe } from 'lucide-react'
import Image from 'next/image'
import { Session } from '@/types'
import BookingModal from './BookingModal'

type Props = {
  sessions: Session[]
}

const DAYS = Array.from({ length: 7 }, (_, i) => i)

export default function ScheduleClient({ sessions }: Props) {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  const daySessions = sessions.filter((s) =>
    isSameDay(new Date(s.starts_at), selectedDay)
  )

  const monthLabel = format(weekStart, 'MMMM yyyy', { locale: es })
    .replace(/^\w/, (c) => c.toUpperCase())

  return (
    <section className="w-full bg-[#f4f7fa] min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Title row */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900">Horario</h1>
          <button className="flex items-center gap-2 border border-gray-300 bg-white rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
          </button>
        </div>

        {/* Timezone row */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <span className="font-medium">Zona horaria:</span>
          <button className="flex items-center gap-1.5 border border-gray-200 bg-white rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
            <Globe className="w-4 h-4 text-gray-500" />
            <span>Mexico - Central Time</span>
            <ChevronRight className="w-3 h-3 text-gray-400 rotate-90" />
          </button>
        </div>

        {/* Week navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4">
          {/* Month + nav */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <button className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900">
              {monthLabel}
              <ChevronRight className="w-4 h-4 rotate-90 text-gray-400" />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekStart((w) => subWeeks(w, 1))}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => {
                  const today = new Date()
                  setWeekStart(startOfWeek(today, { weekStartsOn: 1 }))
                  setSelectedDay(today)
                }}
                className="px-4 py-1.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hoy
              </button>
              <button
                onClick={() => setWeekStart((w) => addWeeks(w, 1))}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Day selector */}
          <div className="grid grid-cols-7">
            {DAYS.map((offset) => {
              const day = addDays(weekStart, offset)
              const isSelected = isSameDay(day, selectedDay)
              const isToday = isSameDay(day, new Date())
              return (
                <button
                  key={offset}
                  onClick={() => setSelectedDay(day)}
                  className={`flex flex-col items-center py-4 transition-colors border-r last:border-r-0 border-gray-100
                    ${isSelected
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <span className="text-xs font-medium mb-1 capitalize">
                    {format(day, 'EEE', { locale: es }).replace('.', '')}
                  </span>
                  <span className={`text-lg font-bold leading-none ${isSelected ? 'text-white' : isToday ? 'text-blue-600' : ''}`}>
                    {format(day, 'd')}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Date label */}
        <div className="bg-gray-200 rounded-xl px-4 py-2 mb-4 text-sm text-gray-600 font-medium capitalize">
          {format(selectedDay, "EEEE d MMMM yyyy", { locale: es })}
        </div>

        {/* Sessions */}
        <div className="flex flex-col gap-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {daySessions.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              No hay clases programadas para este día.
            </div>
          ) : (
            daySessions.map((session, i) => {
              const spotsLeft = session.session_availability?.spots_left ?? 0
              const isFull = spotsLeft <= 0
              const isLow = spotsLeft > 0 && spotsLeft <= 3

              return (
                <div
                  key={session.id}
                  className={`flex items-center gap-6 px-6 py-5 ${
                    i < daySessions.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  {/* Time */}
                  <div className="w-20 shrink-0">
                    <p className="font-bold text-gray-900 text-base">
                      {format(new Date(session.starts_at), 'hh:mm aa')}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {session.class_types.duration_mins} mins
                    </p>
                  </div>

                  {/* Image */}
                  <div className="w-36 h-24 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                    {session.class_types.image_url ? (
                      <Image
                        src={session.class_types.image_url}
                        alt={session.class_types.name}
                        width={144}
                        height={96}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-base mb-1">
                      {session.class_types.name}
                    </p>
                    <p className="text-gray-600 text-sm">{session.instructors?.name}</p>
                    <p className="text-gray-400 text-sm">{session.location}</p>
                    {session.class_types.category && (
                      <p className="text-gray-400 text-sm mt-2">{session.class_types.category}</p>
                    )}
                  </div>

                  {/* Right: spots + button */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {isLow && !isFull && (
                      <span className="text-green-600 text-sm font-semibold">
                        {spotsLeft} {spotsLeft === 1 ? 'espacio restante' : 'espacios restantes'}
                      </span>
                    )}
                    {isFull && (
                      <span className="text-red-500 text-sm font-semibold">Lleno</span>
                    )}
                    <button
                      onClick={() => setSelectedSession(session)}
                      disabled={isFull}
                      className="border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-6 py-2 rounded-xl text-sm font-medium min-w-27.5 text-center"
                    >
                      Reservar
                    </button>
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