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
    console.log("Iniciando checkout para sesión:", sessionId, "Usuario:", user.id)

    // 1. Obtener la sesión (Tablas físicas)
    const { data: session, error: sError } = await supabase
      .from('sessions')
      .select('*, class_types(*)')
      .eq('id', sessionId)
      .single()

    if (sError || !session) {
      console.error("Error al buscar sesión:", sError?.message)
      return NextResponse.json({ error: 'Sesión no encontrada', details: sError?.message }, { status: 404 })
    }

    // 2. Obtener disponibilidad (Vista)
    const { data: avail, error: aError } = await supabase
      .from('session_availability')
      .select('spots_left')
      .eq('session_id', sessionId)
      .single()

    if (aError) {
      console.warn("Error en vista de disponibilidad (usando capacidad base):", aError.message)
    }

    const spotsLeft = avail ? avail.spots_left : session.capacity
    if (spotsLeft <= 0) {
      return NextResponse.json({ error: 'No hay espacios disponibles' }, { status: 400 })
    }

    // 3. Crear reserva (ESTE ES EL PASO QUE ESTÁ FALLANDO)
    console.log("Intentando insertar reserva en tabla 'bookings'...")
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
      // ESTE LOG APARECERÁ EN TU TERMINAL DE VS CODE
      console.error("ERROR DETALLADO DE SUPABASE AL INSERTAR RESERVA:", {
        message: bError.message,
        details: bError.details,
        hint: bError.hint,
        code: bError.code
      })
      return NextResponse.json({ 
        error: 'Error al crear reserva', 
        details: bError.message,
        hint: bError.hint 
      }, { status: 500 })
    }

    console.log("Reserva creada con ID:", booking.id)

    // 4. Stripe Checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'mxn',
          product_data: { 
            name: session.class_types?.name || 'Clase de Fitness',
            description: `Sesión en ${session.location || 'Konnen Studio'}`
          },
          unit_amount: session.price_cents,
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
    console.error("Error crítico inesperado en la ruta de checkout:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}