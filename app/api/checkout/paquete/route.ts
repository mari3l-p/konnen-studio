import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { packageId } = await req.json()

    const { data: pkg, error: pkgError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single()

    if (pkgError || !pkg) {
      return NextResponse.json({ error: 'Paquete no encontrado' }, { status: 404 })
    }

    // ✅ Block if it's a first class package and user already bought one
    if (pkg.is_first_class) {
      const { data: previousPurchase } = await supabaseAdmin
        .from('user_packages')
        .select('id')
        .eq('user_id', user.id)
        .eq('package_id', packageId)
        .limit(1)
        .single()

      // Also check other first-class packages (any package with is_first_class = true)
      const { data: anyFirstClass } = await supabaseAdmin
        .from('user_packages')
        .select('id, packages(is_first_class)')
        .eq('user_id', user.id)
        .limit(50)

      const hasUsedFirstClass = anyFirstClass?.some(
        (up: any) => up.packages?.is_first_class === true
      )

      if (previousPurchase || hasUsedFirstClass) {
        return NextResponse.json({
          error: 'El paquete Primera Clase solo puede adquirirse una vez por usuario. Explora nuestros otros paquetes.'
        }, { status: 400 })
      }
    }

    const price = Number(pkg.price)
    if (!price || isNaN(price) || price <= 0) {
      return NextResponse.json({ error: 'Precio del paquete inválido' }, { status: 400 })
    }

    const origin = req.headers.get('origin')
      || req.headers.get('referer')?.split('/').slice(0, 3).join('/')
      || 'http://localhost:3000'

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'mxn',
          product_data: {
            name: `${pkg.title}${pkg.class_type ? ' · ' + pkg.class_type : ''}`,
            description: [
              pkg.classes_count ? `${pkg.classes_count} ${pkg.classes_count === 1 ? 'clase' : 'clases'}` : null,
              pkg.validity ? `Vigencia: ${pkg.validity}` : null,
            ].filter(Boolean).join(' · ') || undefined,
          },
          unit_amount: price * 100,
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