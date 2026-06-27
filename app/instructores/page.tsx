import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import DashboardInstructoresClient from './DashboardInstructoresClient'
import { subDays } from 'date-fns'
import { redirect } from 'next/navigation' 

export default async function DashboardPage() {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
  
  // 1. Obtenemos la sesión actual
  const { data: { session } } = await supabase.auth.getSession()
  
  // ---------------------------------------------------------
  // 🛡️ BARRERA 1: AUTENTICACIÓN (¿Está logueado?)
  // ---------------------------------------------------------
  if (!session?.user) {
    redirect('/instructores/login')
  }

  const userEmail = session.user.email

  // ---------------------------------------------------------
  // 🛡️ BARRERA 2: AUTORIZACIÓN (¿Tiene permiso de ver esto?)
  // ---------------------------------------------------------
  const ADMIN_EMAILS = ['studiokonnen@gmail.com'] 
  const isAdmin = ADMIN_EMAILS.includes(userEmail || '')

  let instructorProfile = null

  if (!isAdmin) {
    const { data: instructor } = await supabase
      .from('instructors')
      .select('*')
      .eq('email', userEmail)
      .single()

    if (!instructor) {
      await supabase.auth.signOut() 
      redirect('/instructores/login?error=no-autorizado')
    }
    
    instructorProfile = instructor
  }

  // ---------------------------------------------------------
  // CARGA DE DATOS 
  // ---------------------------------------------------------
  const { data: classTypes } = await supabase.from('class_types').select('*')
  const { data: instructors } = await supabase.from('instructors').select('*')
  
  const pastDate = subDays(new Date(), 30).toISOString()
  
  // SOLUCIÓN: Usamos bookings(*) para traer todas las columnas de la reserva y evitar el error
  const { data: rawClasses, error } = await supabase
    .from('sessions')
    .select(`
      *,
      class_types(name, duration_mins),
      instructors(name),
      bookings(*) 
    `) 
    .gte('starts_at', pastDate)
    .order('starts_at', { ascending: true })

  if (error) {
    console.error("🚨 Error de Supabase al cargar clases:", error.message)
  }

  // Formateamos y filtramos las reservas activas
  const initialClasses = rawClasses?.map((session: any) => {
    
    // Filtramos las reservas para omitir las canceladas, buscando en las propiedades más comunes
    const activeBookings = session.bookings?.filter((reserva: any) => {
      // Atrapamos el valor sin importar si la columna se llama 'estado', 'status' o 'state' en la tabla de reservas
      const estadoReserva = reserva.estado || reserva.status || reserva.state || '';
      return estadoReserva.toLowerCase() !== 'cancelada' && estadoReserva.toLowerCase() !== 'cancelled';
    }) || [];
    
    const bookedCount = activeBookings.length;
    const capacity = session.capacity || 15;
    
    return {
      ...session,
      availability: {
        booked_count: bookedCount,
        spots_left: capacity - bookedCount
      }
    };
  }) || [];

  return (
    <DashboardInstructoresClient 
      userEmail={userEmail}
      isAdmin={isAdmin} 
      instructorProfile={instructorProfile} 
      initialClasses={initialClasses}
      classTypes={classTypes || []}
      instructors={instructors || []}
    />
  )
}