import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const { eventId, userPackageId } = await request.json()

    if (!eventId || !userPackageId) {
      return NextResponse.json({ error: 'Faltan datos para procesar el registro' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Debes iniciar sesión para registrarte' }, { status: 401 })
    }

    const nombreCliente =
      user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario Konnen'
    const emailCliente = user.email ?? ''

    const { data, error } = await supabase.rpc('registrar_evento_con_paquete', {
      p_event_id: eventId,
      p_user_id: user.id,
      p_user_package_id: userPackageId,
      p_nombre_cliente: nombreCliente,
      p_email_cliente: emailCliente,
    })

    if (error) {
      console.error('Error en registrar_evento_con_paquete:', error)
      return NextResponse.json({ error: error.message || 'No se pudo completar el registro' }, { status: 400 })
    }

    return NextResponse.json({ success: true, registrationId: data })
  } catch (err: any) {
    console.error('Error catastrófico en /api/eventos/registrar:', err)
    return NextResponse.json({ error: 'Error de servidor' }, { status: 500 })
  }
}