import { createSupabaseServerClient } from '@/lib/supabase-server'
import InstructoresClient from './InstructoresClient'

export default async function InstructoresPage() {
  const supabase = await createSupabaseServerClient()
  const { data: instructors } = await supabase.from('instructors').select('*').order('name')
  return <InstructoresClient instructors={instructors ?? []} />
}