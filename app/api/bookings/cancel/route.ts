import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    
    // 1. Cliente del usuario (sometido a reglas de seguridad RLS)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
          },
        },
      }
    )

    // 2. Cliente con privilegios de administrador para hacer los UPDATES
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // <-- IMPORTANTE: Requiere esta variable en tu .env.local
    )

    // 3. Verificamos que el usuario tenga sesión activa
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 4. Leemos qué sesión quiere cancelar
    const { sessionId } = await request.json()

    // 5. Buscamos la reserva activa del usuario para esa sesión
    // Usamos el cliente normal para asegurar que la reserva le pertenece a este usuario
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, user_package_id, status, sessions(starts_at)')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .eq('status', 'confirmed')
      .single()

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Reserva no encontrada o ya cancelada.' }, { status: 404 })
    }

    // 6. BARRERA DE SEGURIDAD (Backend): Validar las 8 horas
    const sessionData = booking.sessions as any
    const startsAt = new Date(sessionData.starts_at).getTime()
    const now = Date.now()
    const hoursUntil = (startsAt - now) / (1000 * 60 * 60)

    if (hoursUntil < 8) {
      return NextResponse.json({ error: 'Ya pasó el tiempo límite para cancelar (mínimo 8 horas de anticipación).' }, { status: 400 })
    }

    // 7. Cancelamos la reserva usando SUPABASE ADMIN
    const { error: cancelError } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', booking.id)

    if (cancelError) throw cancelError

    // 8. Devolvemos el crédito al paquete del usuario usando SUPABASE ADMIN
    if (booking.user_package_id) {
      // Obtenemos cuántas clases le quedan actualmente
      const { data: pkg } = await supabaseAdmin
        .from('user_packages')
        .select('classes_remaining')
        .eq('id', booking.user_package_id)
        .single()

      if (pkg) {
        await supabaseAdmin
          .from('user_packages')
          .update({ 
            classes_remaining: pkg.classes_remaining + 1,
            status: 'active' 
          })
          .eq('id', booking.user_package_id)
      }
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}