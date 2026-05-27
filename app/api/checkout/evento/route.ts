import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Cliente Admin para saltarnos cualquier bloqueo de seguridad de Supabase
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Debes iniciar sesión para registrarte al evento' }, { status: 401 })
    }

    const { eventId, nombreCliente } = await req.json()

    // 1. Buscamos el evento
    const { data: evento, error: eventoError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventoError || !evento) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
    }

    // 2. Calculamos el precio
    const ahora = new Date()
    const limite = evento.fecha_limite_especial ? new Date(evento.fecha_limite_especial) : null
    const esPrecioEspecial = evento.precio_especial && limite && ahora < limite
    const precioFinal = esPrecioEspecial ? evento.precio_especial : evento.price

    if (precioFinal === undefined || precioFinal === null || isNaN(precioFinal) || precioFinal <= 0) {
      return NextResponse.json({ error: 'El evento no tiene un precio válido configurado' }, { status: 400 })
    }

    // 3. Creamos el registro usando el supabaseAdmin (Cero bloqueos)
    const { data: registro, error: registroError } = await supabaseAdmin
      .from('registros_eventos')
      .insert([{
        event_id: evento.id,
        user_id: user.id,
        nombre_cliente: nombreCliente || 'Usuario Konnen',
        email_cliente: user.email,
        estado_pago: 'pendiente',
      }])
      .select('id')
      .single()

    if (registroError || !registro) {
      console.error("Error BD:", registroError)
      return NextResponse.json({ error: `Error BD: ${registroError?.message}` }, { status: 500 })
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000'

    // 4. Creamos la sesión en Stripe
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [{
        price_data: {
          currency: 'mxn',
          product_data: {
            name: `${evento.title}`,
            description: evento.creditos_otorgados 
              ? `Incluye ${evento.creditos_otorgados} créditos (Válidos por ${evento.dias_validez} días).` 
              : 'Registro al evento.',
          },
          unit_amount: precioFinal * 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/eventos?success=1`,
      cancel_url: `${origin}/eventos`,
      metadata: {
        userId: user.id,
        eventId: evento.id,
        registroId: registro.id,
        eventCredits: String(evento.creditos_otorgados || 0),
        eventValidityDays: String(evento.dias_validez || 0),
      },
    })

    // 5. Guardamos el ID de Stripe
    await supabaseAdmin
      .from('registros_eventos')
      .update({ stripe_session_id: checkoutSession.id })
      .eq('id', registro.id)

    return NextResponse.json({ url: checkoutSession.url })

  } catch (err: any) {
    console.error('Checkout error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}