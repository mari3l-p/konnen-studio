import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Debes iniciar sesión para reservar' }, { status: 401 })
    }

    const { sessionId } = await req.json()

    // ✅ Don't join session_availability — it's a view, not a table
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*, class_types(*)')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      console.error('Session error:', sessionError?.message)
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    // ✅ Check availability separately from the view
    const { data: availability } = await supabase
      .from('session_availability')
      .select('spots_left')
      .eq('session_id', sessionId)
      .single()

    if (!availability || availability.spots_left <= 0) {
      return NextResponse.json({ error: 'No hay espacios disponibles' }, { status: 400 })
    }

    // Check for existing confirmed booking
    const { data: existing } = await supabase
      .from('bookings')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .eq('status', 'confirmed')
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Ya tienes una reserva confirmada para esta clase' }, { status: 400 })
    }

    const origin = req.headers.get('origin')
      || req.headers.get('referer')?.split('/').slice(0, 3).join('/')
      || 'http://localhost:3000'

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'mxn',
          product_data: { name: session.class_types.name },
          unit_amount: session.price * 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/horario?success=1`,
      cancel_url: `${origin}/horario?cancelled=1`,
      customer_email: user.email,
      metadata: {
        sessionId: session.id,
        userId: user.id,
      },
    })

    return NextResponse.json({ url: checkoutSession.url })

  } catch (err: any) {
    console.error('Checkout error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}