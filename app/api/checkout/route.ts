import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Error de autenticación:", authError?.message)
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { sessionId } = await req.json()
    console.log("Iniciando checkout. Sesión:", sessionId, "Usuario:", user.id)

    // 1. Obtener la sesión (Usando la nueva columna 'price')
    const { data: session, error: sError } = await supabase
      .from('sessions')
      .select('*, class_types(*)')
      .eq('id', sessionId)
      .single()

    if (sError || !session) {
      console.error("Error al buscar sesión:", sError?.message)
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    // 2. Obtener disponibilidad desde la Vista
    const { data: avail } = await supabase
      .from('session_availability')
      .select('spots_left')
      .eq('session_id', sessionId)
      .single()

    const spotsLeft = avail ? avail.spots_left : session.capacity
    if (spotsLeft <= 0) {
      return NextResponse.json({ error: 'No hay espacios disponibles' }, { status: 400 })
    }

    // 3. Crear reserva pendiente
    const { data: booking, error: bError } = await supabase
      .from('bookings')
      .insert({ 
        session_id: sessionId, 
        user_id: user.id, 
        status: 'pending' 
      })
      .select()
      .single()

    if (bError) {
      console.error("Error al insertar reserva:", bError.message)
      return NextResponse.json({ error: 'Error al crear reserva', details: bError.message }, { status: 500 })
    }

    // 4. Crear Stripe Checkout Session
    // Convertimos el precio (ej. 250) a centavos (25000) para Stripe
    const amountInCents = Math.round(Number(session.price) * 100)

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'mxn',
          product_data: { 
            name: session.class_types?.name || 'Clase Konnen',
            description: `Sesión en ${session.location}`
          },
          unit_amount: amountInCents, 
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/horario?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/horario?cancelled=1`,
      metadata: { 
        bookingId: booking.id, 
        userId: user.id 
      },
    })

    return NextResponse.json({ url: checkoutSession.url })

  } catch (err: any) {
    console.error("Error crítico en checkout:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}