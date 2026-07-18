import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import DashboardInstructoresClient from './DashboardInstructoresClient'
import { subDays } from 'date-fns'
import { redirect } from 'next/navigation' 

export default async function DashboardPage() {
  const cookieStore = await cookies()
  
  // Cliente con la sesión del usuario actual (respeta RLS)
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
  
  // 1. Validar la sesión del usuario
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    redirect('/instructores/login')
  }

  const userEmail = session.user.email
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

  // Consultas de catálogos generales
  const { data: classTypes } = await supabase.from('class_types').select('*')
  const { data: instructors } = await supabase.from('instructors').select('*')
  
  const pastDate = subDays(new Date(), 30).toISOString()
  
  // 2. Cliente de Administración para omitir RLS de forma segura en el servidor
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Consulta final: Traemos todo conectado a profiles y específicamente su full_name
  const { data: rawClasses, error } = await supabaseAdmin
    .from('sessions')
    .select(`
      *,
      class_types(name, duration_mins),
      instructors(name),
      bookings(*, profiles(full_name)) 
    `) 
    .gte('starts_at', pastDate)
    .order('starts_at', { ascending: true })

  if (error) {
    console.error("Error de Supabase al cargar clases:", error.message)
  }

  // Formateamos los datos calculando la disponibilidad y mapeando los asistentes
  const initialClasses = rawClasses?.map((session: any) => {
    
    const activeBookings = session.bookings?.filter((reserva: any) => {
      const estadoReserva = reserva.status || '';
      return estadoReserva.toLowerCase() !== 'cancelled' && estadoReserva.toLowerCase() !== 'cancelada';
    }) || [];
    
    // Extraemos el ID y el nombre. Prioridad: guest_name (reserva grupal con nombre
    // específico del invitado) -> full_name del perfil (reserva individual normal)
    // -> texto genérico como último respaldo.
    const attendees = activeBookings.map((reserva: any) => {
      const perfil = reserva.profiles || {};
      return {
        id: reserva.id,
        name: reserva.guest_name || perfil.full_name || 'Reserva manual sin nombre'
      };
    });
    
    const bookedCount = activeBookings.length;
    const capacity = session.capacity || 15;
    
    // Omitimos la propiedad cruda 'bookings' para no mandar metadatos innecesarios al cliente
    const { bookings, ...sessionWithoutBookings } = session;

    return {
      ...sessionWithoutBookings,
      attendees, 
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