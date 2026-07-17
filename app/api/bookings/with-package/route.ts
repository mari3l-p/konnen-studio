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

    const { sessionId, userPackageId } = await req.json()

    if (!sessionId || !userPackageId) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    // La lógica de verificar si la reserva ya existía (cancelada) 
    // ahora vive dentro de la función RPC 'realizar_reserva'
    const { data, error } = await supabaseAdmin.rpc('realizar_reserva', {
      p_user_id: user.id,
      p_session_id: sessionId,
      p_package_id: userPackageId,
    })

    if (error) {
      console.error('Error en RPC:', error)
      return NextResponse.json({ error: 'Error interno en la base de datos' }, { status: 500 })
    }

    // data es un array de filas porque definimos RETURNS TABLE en la función SQL
    const result = data[0]

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}