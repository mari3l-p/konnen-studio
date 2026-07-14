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
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { sessionId } = await req.json()
    if (!sessionId) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

    const { data, error } = await supabaseAdmin.rpc('cancelar_reserva', {
      p_user_id: user.id,
      p_session_id: sessionId,
      p_min_hours_before: 8,
    })

    if (error) {
      console.error('Cancel RPC error:', error.message)
      return NextResponse.json({ error: 'Error al cancelar la reserva' }, { status: 500 })
    }

    if (!data?.success) {
      return NextResponse.json({ error: data?.error ?? 'No se pudo cancelar la reserva' }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}