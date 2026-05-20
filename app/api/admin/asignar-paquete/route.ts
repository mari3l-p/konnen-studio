import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// 1. Pon aquí tu correo de administrador (solo este correo podrá hacer esto)
const ADMIN_EMAILS = ['mari3lpalacio@gmail.com'] 

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 2. Verificamos que quien hace click sea el Admin
    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'No autorizado. Solo administradores pueden hacer esto.' }, { status: 401 })
    }

    const { targetUserId, packageId } = await req.json()

    if (!targetUserId || !packageId) {
      return NextResponse.json({ error: 'Faltan datos (Usuario o Paquete)' }, { status: 400 })
    }

    // 3. Buscamos los detalles del paquete que elegiste en el dropdown
    const { data: pkg, error: pkgError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single()

    if (pkgError || !pkg) {
      return NextResponse.json({ error: 'Paquete no encontrado en la base de datos' }, { status: 404 })
    }

    // 4. Le asignamos el paquete al usuario (COMO SI HUBIERA PAGADO)
    // 🚨 IMPORTANTE: Cambia 'user_packages' por el nombre real de tu tabla donde guardas los paquetes comprados por los clientes
        const { error: insertError } = await supabase
        .from('user_packages') 
        .insert({
            user_id: targetUserId,
            package_id: pkg.id,
            classes_remaining: pkg.classes_count, // <-- CORREGIDO
            expires_at: new Date(Date.now() + (pkg.validity_days || 30) * 24 * 60 * 60 * 1000).toISOString(), // <-- CORREGIDO
            stripe_payment_intent_id: 'pago_fisico_en_estudio', // Marcamos que fue en efectivo
            status: 'active' // <-- CORREGIDO (basado en tu webhook de stripe)
        })

    if (insertError) throw insertError

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Error al asignar paquete:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}