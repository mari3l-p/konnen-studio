import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Lógica de compatibilidad dinámica
function disciplinesMatch(packageClassType: string, sessionDiscipline: string): boolean {
  if (!packageClassType || !sessionDiscipline) return false

  const pkg = packageClassType.toLowerCase().trim()
  const cls = sessionDiscipline.toLowerCase().trim()

  // 1. Validar el comodín: si el paquete es para todas las disciplinas
  if (pkg.includes('todas las disciplinas') || pkg.includes('todas')) return true

  // 2. Comparación dinámica: si el nombre es exactamente igual 
  // o si uno contiene parte del nombre del otro (ej: "Indoor Cycling" vs "Indoor")
  if (pkg === cls || pkg.includes(cls) || cls.includes(pkg)) return true

  return false
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { sessionId, userPackageId } = await req.json()

    // 1. Verificar paquete
    const { data: userPackage, error: pkgError } = await supabaseAdmin
      .from('user_packages')
      .select('*, packages(title, class_type)')
      .eq('id', userPackageId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('classes_remaining', 0)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (pkgError || !userPackage) {
      return NextResponse.json({ error: 'Paquete no válido, sin clases disponibles o expirado' }, { status: 400 })
    }

    // 2. Obtener sesión
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('*, class_types(name, discipline)')
      .eq('id', sessionId)
      .single()

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    // 3. Validar horario
    const sessionStartsAt = new Date(sessionData.starts_at)
    const nowMx = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }))
    const sessionMx = new Date(sessionStartsAt.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }))

    if (sessionMx < nowMx) {
      return NextResponse.json({ error: 'Esta clase ya finalizó' }, { status: 400 })
    }

    // 4. Validar compatibilidad (Respaldo en caso de que discipline sea null)
    const sessionDiscipline: string = (sessionData.class_types as any)?.discipline || (sessionData.class_types as any)?.name || ''
    const packageClassType: string = (userPackage.packages as any)?.class_type || ''

    if (!disciplinesMatch(packageClassType, sessionDiscipline)) {
      return NextResponse.json({
        error: `Tu paquete de "${packageClassType || 'Desconocido'}" no puede usarse para clases de "${sessionDiscipline}".`
      }, { status: 400 })
    }

    // 5. Validar disponibilidad
    const { data: availability } = await supabaseAdmin
      .from('session_availability')
      .select('spots_left')
      .eq('session_id', sessionId)
      .single()

    if (!availability || availability.spots_left <= 0) {
      return NextResponse.json({ error: 'No hay espacios disponibles' }, { status: 400 })
    }

    // 6. Validar duplicados y reciclar reservas previas
    const { data: existingBooking } = await supabaseAdmin
      .from('bookings')
      .select('id, status')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (existingBooking) {
      if (existingBooking.status === 'confirmed') {
        return NextResponse.json({ error: 'Ya tienes una reserva activa para esta clase' }, { status: 400 })
      }
      
      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({ 
           status: 'confirmed', 
           user_package_id: userPackageId
        })
        .eq('id', existingBooking.id)

      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('bookings')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          status: 'confirmed',
          user_package_id: userPackageId,
        })

      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // 7. Descontar crédito
    const newRemaining = userPackage.classes_remaining - 1
    await supabaseAdmin
      .from('user_packages')
      .update({
        classes_remaining: newRemaining,
        status: newRemaining === 0 ? 'expired' : 'active',
      })
      .eq('id', userPackageId)

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Booking with package error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}