import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { sessionId } = await req.json()

  // Verificar que la sesión existe y tiene espacios
  const { data: session } = await supabase
    .from('sessions')
    .select('*, class_types(*), session_availability(spots_left)')
    .eq('id', sessionId)
    .single()

  if (!session) return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
  if ((session.session_availability?.spots_left ?? 0) <= 0)
    return NextResponse.json({ error: 'No hay espacios disponibles' }, { status: 400 })

  // Verificar que no tenga ya una reserva
  const { data: existing } = await supabase
    .from('bookings')
    .select('id')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (existing) return NextResponse.json({ error: 'Ya tienes una reserva para esta clase' }, { status: 400 })

  // Crear booking en pending
  const { data: booking } = await supabase
    .from('bookings')
    .insert({ session_id: sessionId, user_id: user.id, status: 'pending' })
    .select()
    .single()

  // Crear Stripe Checkout Session
  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'mxn',
        product_data: { name: session.class_types.name },
        unit_amount: session.price_cents,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/horario?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/horario?cancelled=1`,
    metadata: { bookingId: booking.id, userId: user.id },
  })

  return NextResponse.json({ url: checkoutSession.url })
}