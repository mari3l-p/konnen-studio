import { createSupabaseServerClient } from '@/lib/supabase-server'
import PaquetesClient from './PaquetesClient'

export default async function PaquetesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: packages } = await supabase
  .from('packages')
  .select('id, title, validity, validity_days, class_type, classes_count, price, note, is_active, sort_order')
  .eq('is_active', true)
  .order('sort_order')

  return <PaquetesClient packages={packages ?? []} />
}