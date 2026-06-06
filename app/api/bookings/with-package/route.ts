import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function normalizeDiscipline(str: string): string {
  return str.toLowerCase().trim()
}

function disciplinesMatch(packageClassType: string, sessionDiscipline: string): boolean {
  if (normalizeDiscipline(packageClassType) === 'todas las disciplinas') return true

  const pkg = normalizeDiscipline(packageClassType)
  const disc = normalizeDiscipline(sessionDiscipline)

  // Indoor Cycling
  if ((pkg.includes('indoor') || pkg.includes('cycling')) &&
      (disc.includes('indoor') || disc.includes('cycling'))) return true

  // Sculpt / Tone
  if ((pkg.includes('sculpt') || pkg.includes('tone')) &&
      (disc.includes('sculpt') || disc.includes('tone') ||
       disc.includes('define') || disc.includes('barre') ||
       disc.includes('funcional'))) return true

  return false
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { sessionId, userPackageId } = await req.json()

    // 1. Verify package is valid, active, has credits, not expired
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
      return NextResponse.json({
        error: 'Paquete no válido, sin clases disponibles o expirado'
      }, { status: 400 })
    }

    // 2. Fetch session with class type discipline
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('*, class_types(name, discipline)')
      .eq('id', sessionId)
      .single()

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    // 3. Check the class hasn't already passed (Mexico timezone)
    const sessionStartsAt = new Date(sessionData.starts_at)
    const nowMx = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }))
    const sessionMx = new Date(sessionStartsAt.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }))

    if (sessionMx < nowMx) {
      return NextResponse.json({ error: 'Esta clase ya finalizó' }, { status: 400 })
    }

    // 4. Validate discipline compatibility
    const sessionDiscipline: string = (sessionData.class_types as any)?.discipline ?? ''
    const packageClassType: string = (userPackage.packages as any)?.class_type ?? ''

    if (sessionDiscipline && packageClassType && !disciplinesMatch(packageClassType, sessionDiscipline)) {
      return NextResponse.json({
        error: `Tu paquete de "${packageClassType}" no puede usarse para clases de "${sessionDiscipline}". Necesitas un paquete compatible.`
      }, { status: 400 })
    }

    // 5. Check availability
    const { data: availability } = await supabaseAdmin
      .from('session_availability')
      .select('spots_left')
      .eq('session_id', sessionId)
      .single()

    if (!availability || availability.spots_left <= 0) {
      return NextResponse.json({ error: 'No hay espacios disponibles' }, { status: 400 })
    }

    // 6. Check no duplicate confirmed booking
    const { data: existing } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .eq('status', 'confirmed')
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Ya tienes una reserva para esta clase' }, { status: 400 })
    }

    // 7. Create confirmed booking
    const { error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        status: 'confirmed',
        user_package_id: userPackageId,
      })

    if (bookingError) {
      return NextResponse.json({ error: bookingError.message }, { status: 500 })
    }

    // 8. Deduct one class from the package
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