import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// 1. Pon aquí tu correo de administrador (solo este correo podrá hacer esto)
const ADMIN_EMAILS = ['studiokonnen@gmail.com'] 

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 2. Verificamos que quien hace click sea el Admin
    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'No autorizado. Solo administradores pueden hacer esto.' }, { status: 401 })
    }

    // RECIBIMOS EL METODO DE PAGO
    const { targetUserId, packageId, metodoPago } = await req.json()

    if (!targetUserId || !packageId) {
      return NextResponse.json({ error: 'Faltan datos (Usuario o Paquete)' }, { status: 400 })
    }

    // 3. Buscamos los detalles del paquete
    const { data: pkg, error: pkgError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single()

    if (pkgError || !pkg) {
      return NextResponse.json({ error: 'Paquete no encontrado en la base de datos' }, { status: 404 })
    }

    // Definimos qué guardar en base al método de pago elegido
    const metodoRegistro = metodoPago === 'transferencia' 
      ? 'pago_por_transferencia_manual' 
      : 'pago_fisico_en_estudio';

    // 4. Le asignamos el paquete al usuario
    const { error: insertError } = await supabase
      .from('user_packages') 
      .insert({
          user_id: targetUserId,
          package_id: pkg.id,
          classes_remaining: pkg.classes_count, 
          expires_at: new Date(Date.now() + (pkg.validity_days || 30) * 24 * 60 * 60 * 1000).toISOString(), 
          stripe_payment_intent_id: metodoRegistro, 
          status: 'active' 
      })

    if (insertError) throw insertError

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Error al asignar paquete:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}