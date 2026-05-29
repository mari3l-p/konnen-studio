import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { sessionId, userPackageId } = await req.json()

    // Verify package is valid
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

    // Fetch session discipline
    const { data: sessionData } = await supabaseAdmin
      .from('sessions')
      .select('class_types(name, discipline)')
      .eq('id', sessionId)
      .single()

    const sessionDiscipline: string | null = (sessionData?.class_types as any)?.discipline ?? null
    const packageClassType: string = (userPackage.packages as any)?.class_type ?? ''

    // Validate discipline compatibility
    if (
      sessionDiscipline &&
      packageClassType !== 'Todas las disciplinas' &&
      !packageClassType.toLowerCase().includes(sessionDiscipline.toLowerCase()) &&
      !sessionDiscipline.toLowerCase().includes(packageClassType.toLowerCase())
    ) {
      return NextResponse.json({
        error: `Este paquete es para ${packageClassType} y no puede usarse para reservar ${sessionDiscipline}`
      }, { status: 400 })
    }

    // Check session availability
    const { data: availability } = await supabaseAdmin
      .from('session_availability')
      .select('spots_left')
      .eq('session_id', sessionId)
      .single()

    if (!availability || availability.spots_left <= 0) {
      return NextResponse.json({ error: 'No hay espacios disponibles' }, { status: 400 })
    }

    // Check no duplicate
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

    // Create booking
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

    // Deduct class
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