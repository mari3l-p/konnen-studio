'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Search } from 'lucide-react'
import { AsignarPaqueteManual } from './AsignarPaqueteManual'

type UserData = {
  userId: string
  fullName: string
  totalBookings: number
  confirmed: number
  lastBooking: string | null
}

type PackageData = {
  id: string
  title: string
  price: number
}

export default function ClientesClient({ users, packages }: { users: UserData[], packages: PackageData[] }) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filtrar los perfiles según lo que el usuario escriba en la barra de búsqueda
  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.userId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      
      {/* Cabecera y Barra de Búsqueda */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-gray-400 text-sm mt-1">{users.length} clientes registrados</p>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-900 border border-gray-800 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all w-full sm:w-72"
          />
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-widest bg-gray-900/50">
              <th className="text-left px-6 py-4">Cliente</th>
              <th className="text-left px-6 py-4">Reservas totales</th>
              <th className="text-left px-6 py-4">Confirmadas</th>
              <th className="text-left px-6 py-4">Última reserva</th>
              <th className="text-left px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  {searchQuery ? 'No se encontraron clientes con esa búsqueda' : 'Sin clientes aún'}
                </td>
              </tr>
            )}
            
            {filteredUsers.map((u) => (
              <tr key={u.userId} className="border-b border-gray-800 hover:bg-gray-800/60 transition-colors">
                
                {/* Nombre y un fragmento corto de su ID */}
                <td className="px-6 py-4">
                  <p className="text-white font-semibold">{u.fullName}</p>
                  <p className="text-gray-500 text-[11px] font-mono mt-0.5" title={u.userId}>
                    ID: {u.userId.split('-')[0]}...
                  </p>
                </td>

                <td className="px-6 py-4 text-white font-medium">
                  {u.totalBookings}
                </td>
                <td className="px-6 py-4 text-green-400 font-medium">
                  {u.confirmed}
                </td>
                
                {/* Formateo condicional y seguro de la fecha */}
                <td className="px-6 py-4 text-gray-400">
                  {u.lastBooking ? (
                    format(new Date(u.lastBooking), "dd MMM yyyy", { locale: es })
                  ) : (
                    <span className="text-gray-600 italic text-xs">Ninguna aún</span>
                  )}
                </td>
                
                <td className="px-6 py-4">
                  <AsignarPaqueteManual 
                    targetUserId={u.userId} 
                    packages={packages} 
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}