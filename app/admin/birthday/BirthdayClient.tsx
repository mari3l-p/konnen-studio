'use client'

import { useMemo } from 'react'
import { Cake, Gift } from 'lucide-react'

type Profile = {
  id: string
  full_name: string
  birthday: string
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export default function BirthdayClient({ profiles }: { profiles: Profile[] }) {
  
  // Agrupamos y ordenamos los cumpleaños automáticamente
  const grouped = useMemo(() => {
    // 1. Inicializamos los 12 meses vacíos
    const groups = MESES.map((m, i) => ({
      month: m,
      index: i,
      users: [] as (Profile & { day: number })[]
    }))

    // 2. Repartimos a los usuarios en su mes correspondiente
    profiles.forEach(p => {
      if (!p.birthday) return
      
      // La fecha viene en formato YYYY-MM-DD
      const parts = p.birthday.split('-')
      if (parts.length === 3) {
        const monthIndex = parseInt(parts[1], 10) - 1 // Restamos 1 porque Enero es 0 en JS
        const day = parseInt(parts[2], 10)
        
        if (monthIndex >= 0 && monthIndex < 12) {
          groups[monthIndex].users.push({ ...p, day })
        }
      }
    })

    // 3. Ordenamos por día dentro de cada mes (ej. el 2 de mayo va antes que el 15 de mayo)
    groups.forEach(g => {
      g.users.sort((a, b) => a.day - b.day)
    })

    return groups
  }, [profiles])

  // Detectamos el mes actual para resaltarlo
  const mesActual = new Date().getMonth()

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cumpleaños</h1>
          <p className="text-gray-400 text-sm mt-1">Celebra con tus clientes y fideliza a tu comunidad</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm">
          <Cake className="w-5 h-5 text-pink-500" />
          <span className="text-sm font-bold text-white">{profiles.length} Registros</span>
        </div>
      </div>

      {/* Grid de Meses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {grouped.map((group) => {
          const isCurrentMonth = group.index === mesActual
          const hasUsers = group.users.length > 0

          // Ocultamos los meses que ya pasaron o que no tienen usuarios, 
          // a menos que sea el mes actual (ese siempre se muestra)
          if (!hasUsers && !isCurrentMonth) return null 

          return (
            <div 
              key={group.month} 
              className={`rounded-2xl border ${isCurrentMonth ? 'bg-gray-900 border-pink-500/40 shadow-[0_0_20px_rgba(236,72,153,0.1)]' : 'bg-gray-900 border-gray-800'} p-5 flex flex-col h-full min-h-[250px] transition-all`}
            >
              {/* Título del mes */}
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-800">
                <h3 className={`font-black tracking-tight ${isCurrentMonth ? 'text-pink-400' : 'text-white'} text-xl`}>
                  {group.month}
                </h3>
                {isCurrentMonth && (
                  <span className="bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></span>
                    Mes Actual
                  </span>
                )}
              </div>

              {/* Lista de usuarios */}
              {hasUsers ? (
                <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[350px] pr-1">
                  {group.users.map(u => (
                    <div key={u.id} className={`flex items-center gap-3 p-3 rounded-xl border ${isCurrentMonth ? 'bg-gray-800/80 border-gray-700 hover:border-pink-500/30' : 'bg-gray-800/40 border-gray-800/80 hover:border-gray-600'} transition-colors`}>
                      
                      {/* Icono de Calendario / Día */}
                      <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 shadow-sm ${isCurrentMonth ? 'bg-pink-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
                        <span className={`text-[10px] font-bold uppercase tracking-wider leading-none mb-1 opacity-80`}>
                          {group.month.substring(0,3)}
                        </span>
                        <span className="text-xl font-black leading-none">{u.day}</span>
                      </div>
                      
                      {/* Nombre */}
                      <div className="min-w-0 flex-1">
                        <p className={`font-semibold text-sm truncate ${isCurrentMonth ? 'text-white' : 'text-gray-300'}`}>
                          {u.full_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">¡Feliz cumpleaños!</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty state para el mes actual si nadie cumple años */
                <div className="flex flex-col items-center justify-center flex-1 py-8 opacity-60">
                  <Gift className="w-10 h-10 text-gray-600 mb-3" />
                  <p className="text-sm text-gray-400 font-medium text-center px-4">
                    Nadie cumple años este mes.
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}