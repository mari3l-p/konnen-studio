import { createSupabaseServerClient } from '@/lib/supabase-server'
import ClasesClient from './ClasesClient'

export default async function ClasesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: classTypes } = await supabase.from('class_types').select('*').order('name')
  return <ClasesClient classTypes={classTypes ?? []} />
}