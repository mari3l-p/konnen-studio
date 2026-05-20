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
    const { sessionId, userId, packageId, packageClasses, packageValidityDays } = session.metadata!

    // ✅ Reserva de clase individual tras confirmar el pago en Stripe
    if (sessionId && userId && !packageId) {
      try {
        // Usamos .maybeSingle() para evitar que truene si no hay filas (retorna null en su lugar)
        const { data: existing, error: searchError } = await supabaseAdmin
          .from('bookings')
          .select('id')
          .eq('session_id', sessionId)
          .eq('user_id', userId)
          .maybeSingle()

        if (searchError) {
          console.error('❌ Error buscando reserva existente:', searchError.message)
        }

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

          if (insertError) {
            console.error('❌ Error al insertar la reserva en Supabase:', insertError.message)
          } else {
            console.log('✅ Reserva creada y confirmada exitosamente.')
          }
        } else {
          console.log('⚠️ La reserva ya existía (Evitando duplicados por idempotencia).')
        }
      } catch (dbErr: any) {
        console.error('❌ Error inesperado procesando la reserva en la BD:', dbErr.message)
      }
    }

    // ✅ Compra y activación de un paquete
    if (packageId && userId) {
      try {
        console.log(`Activating package: ${packageId} for User: ${userId}`)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + Number(packageValidityDays))

        const { error: packageInsertError } = await supabaseAdmin
          .from('user_packages')
          .insert({
            user_id: userId,
            package_id: packageId,
            classes_remaining: Number(packageClasses),
            expires_at: expiresAt.toISOString(),
            stripe_payment_intent_id: session.payment_intent as string,
            status: 'active',
          })

        if (packageInsertError) {
          console.error('❌ Error al insertar el paquete del usuario:', packageInsertError.message)
        } else {
          console.log('✅ Paquete activado exitosamente.')
        }
      } catch (dbErr: any) {
        console.error('❌ Error inesperado procesando el paquete en la BD:', dbErr.message)
      }
    }
  }

  return NextResponse.json({ received: true })
}