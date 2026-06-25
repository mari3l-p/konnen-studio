'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Package = {
  id: string
  title: string
  price: number
}

export function AsignarPaqueteManual({ targetUserId, packages }: { targetUserId: string, packages: Package[] }) {
  const [loading, setLoading] = useState(false)
  const [packageId, setPackageId] = useState('')
  const router = useRouter()

  const handleAssign = async (metodoPago: 'fisico' | 'transferencia') => {
    if (!packageId) return alert('Por favor selecciona un paquete')
    
    setLoading(true)
    try {
      const res = await fetch('/api/admin/asignar-paquete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, packageId, metodoPago })
      })

      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      const tipoMensaje = metodoPago === 'fisico' ? 'efectivo' : 'transferencia'
      alert(`✅ Paquete asignado con éxito por ${tipoMensaje}.`)
      setPackageId('')
      router.refresh() // Refresca los datos para mostrar el nuevo paquete
      
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <select 
        value={packageId} 
        onChange={(e) => setPackageId(e.target.value)}
        className="bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 border border-gray-700 outline-none w-full"
      >
        <option value="">Elegir paquete...</option>
        {packages.map((pkg) => (
          <option key={pkg.id} value={pkg.id}>
            {pkg.title} (${pkg.price})
          </option>
        ))}
      </select>
      
      <div className="flex gap-2 items-center">
        <button 
          onClick={() => handleAssign('fisico')}
          disabled={loading || !packageId}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex-1"
        >
          {loading ? '...' : 'Pago Físico'}
        </button>
        <button 
          onClick={() => handleAssign('transferencia')}
          disabled={loading || !packageId}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex-1"
        >
          {loading ? '...' : 'Transferencia'}
        </button>
      </div>
    </div>
  )
}