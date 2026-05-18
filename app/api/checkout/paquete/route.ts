import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { packageId } = await req.json()

    const { data: pkg } = await supabase
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single()

    if (!pkg) return NextResponse.json({ error: 'Paquete no encontrado' }, { status: 404 })

    // ✅ Build base URL from the request
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:3000'

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'mxn',
          product_data: {
            name: `${pkg.title}${pkg.class_type ? ' · ' + pkg.class_type : ''}`,
            description: pkg.validity ? `Vigencia: ${pkg.validity}` : undefined,
          },
          unit_amount: pkg.price * 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/membresias?success=1`,
      cancel_url: `${origin}/paquetes`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        packageId: pkg.id,
        packageClasses: String(pkg.classes_count ?? 1),
        packageValidityDays: String(pkg.validity_days ?? 30),
      },
    })

    return NextResponse.json({ url: checkoutSession.url })

  } catch (err: any) {
    console.error('Package checkout error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}