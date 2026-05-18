import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { sessionId, userPackageId } = await req.json()

  // Verify the package belongs to this user and has credits
  const { data: userPackage } = await supabaseAdmin
    .from('user_packages')
    .select('*')
    .eq('id', userPackageId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .gt('classes_remaining', 0)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!userPackage) {
    return NextResponse.json({ error: 'Paquete no válido o sin créditos' }, { status: 400 })
  }

  // Check no duplicate booking
  const { data: existing } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Ya tienes una reserva para esta clase' }, { status: 400 })
  }

  // Create confirmed booking (no payment needed)
  const { error: bookingError } = await supabaseAdmin
    .from('bookings')
    .insert({
      session_id: sessionId,
      user_id: user.id,
      status: 'confirmed',
      user_package_id: userPackageId, // optional: track which package was used
    })

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 })
  }

  // Deduct one class from the package
  const { error: updateError } = await supabaseAdmin
    .from('user_packages')
    .update({ classes_remaining: userPackage.classes_remaining - 1 })
    .eq('id', userPackageId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}