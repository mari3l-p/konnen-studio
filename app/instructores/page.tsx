import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import DashboardInstructoresClient from './DashboardInstructoresClient'
import { subDays } from 'date-fns'
import { redirect } from 'next/navigation' // <-- Importante para proteger la ruta

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
  // Define aquí el/los correos que tienen permisos de Administrador total
  const ADMIN_EMAILS = ['studiokonnen@gmail.com'] 
  const isAdmin = ADMIN_EMAILS.includes(userEmail || '')

  let instructorProfile = null

  // Si no es administrador, verificamos que sea un instructor oficial
  if (!isAdmin) {
    // Busca en la tabla 'instructors' si existe este correo
    // Nota: Asegúrate de que tu tabla 'instructors' tenga una columna 'email'
    const { data: instructor } = await supabase
      .from('instructors')
      .select('*')
      .eq('email', userEmail)
      .single()

    // Si tiene cuenta en Supabase pero NO es administrador ni instructor (ej. un cliente)
    if (!instructor) {
      await supabase.auth.signOut() // Destruimos su sesión por seguridad
      redirect('/instructores/login?error=no-autorizado')
    }
    
    instructorProfile = instructor
  }

  // ---------------------------------------------------------
  // CARGA DE DATOS (Solo llega aquí si pasó las barreras)
  // ---------------------------------------------------------
  const { data: classTypes } = await supabase.from('class_types').select('*')
  const { data: instructors } = await supabase.from('instructors').select('*')
  
  const pastDate = subDays(new Date(), 30).toISOString()
  
  const { data: initialClasses, error } = await supabase
    .from('sessions')
    .select(`
      *,
      class_types(name, duration_mins),
      instructors(name)
    `)
    .gte('starts_at', pastDate)
    .order('starts_at', { ascending: true })

  if (error) {
    console.error("🚨 Error de Supabase al cargar clases:", error.message)
  }

  return (
    <DashboardInstructoresClient 
      userEmail={userEmail}
      isAdmin={isAdmin} 
      instructorProfile={instructorProfile} 
      initialClasses={initialClasses || []}
      classTypes={classTypes || []}
      instructors={instructors || []}
    />
  )
}