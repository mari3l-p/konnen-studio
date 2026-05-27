// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('❌ Error al validar Webhook de Stripe:', err.message)
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 })
  }

  console.log(`🔔 Evento recibido de Stripe: ${event.type}`)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const metadata = session.metadata || {}
    
    // Extraemos TODAS las posibles variables (para paquetes, reservas y eventos)
    const { 
      sessionId, userId, 
      packageId, packageClasses, packageValidityDays,
      eventId, eventCredits, eventValidityDays, registroId
    } = metadata

    // =========================================================================
    // ✅ 1. RESERVA DE CLASE INDIVIDUAL
    // =========================================================================
    if (sessionId && userId && !packageId) {
      try {
        const { data: existing, error: searchError } = await supabaseAdmin
          .from('bookings')
          .select('id')
          .eq('session_id', sessionId)
          .eq('user_id', userId)
          .maybeSingle()

        if (searchError) console.error('❌ Error buscando reserva:', searchError.message)

        if (!existing) {
          console.log(`Creating confirmed booking for User: ${userId} in Session: ${sessionId}`)
          const { error: insertError } = await supabaseAdmin
            .from('bookings')
            .insert({
              session_id: sessionId,
              user_id: userId,
              status: 'confirmed',
              stripe_payment_intent_id: session.payment_intent as string,
            })
          if (insertError) console.error('❌ Error al insertar reserva:', insertError.message)
        }
      } catch (dbErr: any) {
        console.error('❌ Error BD reserva:', dbErr.message)
      }
    }

    // =========================================================================
    // ✅ 2. COMPRA DE PAQUETE REGULAR
    // =========================================================================
    if (packageId && userId) {
      try {
        console.log(`Activating package: ${packageId} for User: ${userId}`)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + Number(packageValidityDays))

        const { error: packageInsertError } = await supabaseAdmin
          .from('user_packages')
          .insert({
            user_id: userId,
            package_id: packageId, // Vinculado al paquete
            classes_remaining: Number(packageClasses),
            expires_at: expiresAt.toISOString(),
            stripe_payment_intent_id: session.payment_intent as string,
            status: 'active',
          })

        if (packageInsertError) console.error('❌ Error paquete:', packageInsertError.message)
      } catch (dbErr: any) {
        console.error('❌ Error BD paquete:', dbErr.message)
      }
    }

    // =========================================================================
    // ✅ 3. COMPRA DE EVENTO (NUEVO: Summer Glow, etc.)
    // =========================================================================
    if (eventId && userId && registroId) {
      try {
        console.log(`Procesando pago de evento ${eventId} para User: ${userId}`)
        
        // 1. Marcar el registro del evento como completado
        await supabaseAdmin
          .from('registros_eventos')
          .update({ estado_pago: 'completado' })
          .eq('id', registroId);

        // 2. Dar los créditos en la tabla de user_packages, pero aislados (sin package_id)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + Number(eventValidityDays))

        const { error: creditosError } = await supabaseAdmin
          .from('user_packages')
          .insert({
            user_id: userId,
            event_id: eventId,   // Vinculado al evento (NO al paquete)
            package_id: null,    // Dejamos el paquete nulo para que no interfiera
            classes_remaining: Number(eventCredits),
            expires_at: expiresAt.toISOString(),
            stripe_payment_intent_id: session.payment_intent as string,
            status: 'active',
          })

        if (!creditosError) {
          await supabaseAdmin
            .from('registros_eventos')
            .update({ creditos_aplicados: true })
            .eq('id', registroId);
          console.log('✅ Créditos del evento activados exitosamente.')
        } else {
          console.error('❌ Error al asignar créditos del evento:', creditosError.message)
        }
      } catch (dbErr: any) {
        console.error('❌ Error BD Evento:', dbErr.message)
      }
    }
  }

  return NextResponse.json({ received: true })
}