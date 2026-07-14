import { createSupabaseServerClient } from '@/lib/supabase-server'
import ClientesInfoClient from './ClientesInfoClient'

export default async function ClientesInfoPage() {
  const supabase = await createSupabaseServerClient()

  // Traemos los perfiles con sus paquetes y también su historial de reservas
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select(`
      id, 
      full_name, 
      email, 
      created_at,
      user_packages (
        id, 
        classes_remaining, 
        expires_at, 
        status,
        packages ( title )
      ),
      bookings (
        id,
        status,
        created_at,
        sessions (
          starts_at,
          class_types ( name )
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al cargar la información de clientes:', error.message)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Info de Clientes</h1>
        <p className="text-gray-400 text-sm mt-1">
          Administra manualmente los paquetes, vigencias y revisa el historial de los clientes.
        </p>
      </div>

      <ClientesInfoClient initialProfiles={profiles || []} />
    </div>
  )
}