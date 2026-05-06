import { createSupabaseServerClient } from '@/lib/supabase-server'
import PaquetesAdminClient from './PaquetesAdminClient'

export default async function PaquetesAdminPage() {
  const supabase = await createSupabaseServerClient()
  const { data: packages } = await supabase
    .from('packages')
    .select('*')
    .order('sort_order')

  return <PaquetesAdminClient packages={packages ?? []} />
}