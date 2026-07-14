import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { sessionId, userPackageId } = await req.json()

    if (!sessionId || !userPackageId) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    // Toda la validación (paquete, disciplina, disponibilidad, duplicados,
    // descuento de crédito) ocurre ahora DENTRO de la función SQL,
    // protegida con locks de fila. Ya no hay condición de carrera posible.
    const { data, error } = await supabaseAdmin.rpc('realizar_reserva', {
      p_user_id: user.id,
      p_session_id: sessionId,
      p_package_id: userPackageId,
    })

    if (error) {
      console.error('Booking RPC error:', error.message)
      return NextResponse.json({ error: 'Error al procesar la reserva' }, { status: 500 })
    }

    if (!data?.success) {
      return NextResponse.json({ error: data?.error ?? 'No se pudo completar la reserva' }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Booking with package error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}