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
  } catch {
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { sessionId, userId, packageId, packageClasses, packageValidityDays } = session.metadata!

    // ✅ Class booking — create booking NOW after payment confirmed
    if (sessionId && userId && !packageId) {
      // Check not already booked (idempotency)
      const { data: existing } = await supabaseAdmin
        .from('bookings')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .single()

      if (!existing) {
        await supabaseAdmin.from('bookings').insert({
          session_id: sessionId,
          user_id: userId,
          status: 'confirmed',
          stripe_payment_intent_id: session.payment_intent as string,
        })
      }
    }

    // ✅ Package purchase — activate user_package
    if (packageId && userId) {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + Number(packageValidityDays))

      await supabaseAdmin.from('user_packages').insert({
        user_id: userId,
        package_id: packageId,
        classes_remaining: Number(packageClasses),
        expires_at: expiresAt.toISOString(),
        stripe_payment_intent_id: session.payment_intent as string,
        status: 'active',
      })
    }
  }

  return NextResponse.json({ received: true })
}