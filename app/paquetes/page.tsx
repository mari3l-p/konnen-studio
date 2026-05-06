import { createSupabaseServerClient } from '@/lib/supabase-server'
import PaquetesClient from './PaquetesClient'

export default async function PaquetesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: packages } = await supabase
    .from('packages')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  return <PaquetesClient packages={packages ?? []} />
}