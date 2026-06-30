import { supabase } from '@/lib/supabase'
import DisciplinasClient from './DisciplinasClient'

// Esto le dice a Next.js que esta página no se debe guardar en caché estáticamente,
// para que siempre traiga los datos frescos de Supabase al recargar.
export const dynamic = 'force-dynamic'

export default async function DisciplinasPage() {
  // 1. Buscamos los datos en Supabase
  const { data: disciplinas } = await supabase
    .from('disciplinas')
    .select('*')
    .order('created_at', { ascending: true })

  // 2. Se los pasamos al componente cliente
  return <DisciplinasClient initialData={disciplinas || []} />
}